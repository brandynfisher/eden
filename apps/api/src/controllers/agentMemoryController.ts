import { MEMORY_LIMITS } from '../lib/constants'
import { Agent } from '../models/Agent'
import { createIdOrSlugQuery } from '../utils/mongoUtils'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const validateAgentAccess = async (agentId: string) => {
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent || agent.deleted) {
    return { agent: null, error: 'Agent not found' }
  }

  return { agent, error: null }
}

const createAgentObjectId = (agentId: string, agentDoc: any, mongoose: any) => {
  return mongoose.Types.ObjectId.isValid(agentId)
    ? new mongoose.Types.ObjectId(agentId)
    : new mongoose.Types.ObjectId(agentDoc._id)
}

// Helper function to invalidate fully_formed_memory for related UserMemory/AgentMemory documents
const invalidateFullyFormedMemories = async (
  server: FastifyInstance,
  sessionMemoryId: string,
) => {
  try {
    const sessionMemoryCollection =
      server.mongoose.connection.db.collection('memory_sessions')
    const sessionMemory = await sessionMemoryCollection.findOne({
      _id: new server.mongoose.Types.ObjectId(sessionMemoryId),
    })

    if (!sessionMemory) {
      return
    }

    const memoryUserCollection =
      server.mongoose.connection.db.collection('memory_user')
    const memoryAgentCollection =
      server.mongoose.connection.db.collection('memory_agent')

    // Handle SessionMemory with memory_type = "directive" -> invalidate UserMemory
    if (
      sessionMemory.memory_type === 'directive' &&
      sessionMemory.related_users
    ) {
      const relatedUsers = Array.isArray(sessionMemory.related_users)
        ? sessionMemory.related_users
        : [sessionMemory.related_users]

      for (const userId of relatedUsers) {
        await memoryUserCollection.updateMany(
          {
            agent_id: sessionMemory.agent_id,
            user_id: userId,
          },
          {
            $set: { fully_formed_memory: null },
          },
        )
      }
    }

    // Handle SessionMemory with memory_type = "fact" or "suggestion" -> invalidate AgentMemory
    if (
      sessionMemory.memory_type === 'fact' ||
      sessionMemory.memory_type === 'suggestion'
    ) {
      // If there's a direct shard relationship
      if (sessionMemory.shard_id) {
        await memoryAgentCollection.updateOne(
          {
            _id: sessionMemory.shard_id,
          },
          {
            $set: { fully_formed_memory: null },
          },
        )
      } else {
        // Find by searching unabsorbed_memory_ids or facts arrays
        await memoryAgentCollection.updateMany(
          {
            agent_id: sessionMemory.agent_id,
            $or: [
              {
                unabsorbed_memory_ids: new server.mongoose.Types.ObjectId(
                  sessionMemoryId,
                ),
              },
              { facts: new server.mongoose.Types.ObjectId(sessionMemoryId) },
            ],
          },
          {
            $set: { fully_formed_memory: null },
          },
        )
      }
    }
  } catch (error) {
    server.log.error(
      { err: error },
      'Error invalidating fully formed memories:',
    )
  }
}

export const getAgentMemory = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_user')
    const memoryRecord = await memoryCollection.findOne({
      agent_id: createAgentObjectId(agentId, agent, server.mongoose),
      user_id: new server.mongoose.Types.ObjectId(userId),
    })

    let unabsorbedDirectives: any[] = []

    // Get unabsorbed directives if they exist
    if (memoryRecord?.unabsorbed_memory_ids?.length > 0) {
      const sessionMemoryCollection =
        server.mongoose.connection.db.collection('memory_sessions')
      const directiveIds = memoryRecord?.unabsorbed_memory_ids.map(
        (id: any) => new server.mongoose.Types.ObjectId(id),
      )

      const query = {
        agent_id: createAgentObjectId(agentId, agent, server.mongoose),
        memory_type: 'directive',
        related_users: new server.mongoose.Types.ObjectId(userId),
        _id: { $in: directiveIds },
      }

      const directives = await sessionMemoryCollection.find(query).toArray()

      unabsorbedDirectives = directives
        .filter(directive => directive.content?.trim() !== '')
        .map(directive => ({
          _id: directive._id,
          content: directive.content,
          createdAt: directive.createdAt,
        }))
    }

    return reply.status(200).send({
      content: memoryRecord?.content || '',
      unabsorbedDirectives,
    })
  } catch (error) {
    server.log.error({ err: error }, 'Error fetching user memory:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const saveAgentMemory = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const { content } = request.body as { content: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_user')
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    await memoryCollection.updateOne(
      {
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          content: content || '',
          fully_formed_memory: null,
        },
        $setOnInsert: {
          agent_id: agentObjectId,
          user_id: new server.mongoose.Types.ObjectId(userId),
          agent_owner: null,
          unabsorbed_memory_ids: [],
        },
      },
      { upsert: true },
    )

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error saving user memory:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// Helper function: retrieve_memory_user
export const retrieveMemoryUser = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_user')
    const memoryRecord = await memoryCollection.findOne({
      agent_id: createAgentObjectId(agentId, agent, server.mongoose),
      user_id: new server.mongoose.Types.ObjectId(userId),
    })

    return reply.status(200).send(memoryRecord || {})
  } catch (error) {
    server.log.error({ err: error }, 'Error retrieving memory user:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// Helper function: retrieve_memory_agent
export const retrieveMemoryAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_agent')
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    // Find all memory_agent documents for this agent
    const memoryRecords = await memoryCollection
      .find({
        agent_id: agentObjectId,
      })
      .toArray()

    const processedRecords: any[] = []

    for (const record of memoryRecords) {
      let factsWithContent: any[] = []
      let unabsorbedWithContent: any[] = []

      // Process facts array (similar to unabsorbed_memory_ids in User Memory)
      if (record.facts && Array.isArray(record.facts)) {
        const memorySessionCollection =
          server.mongoose.connection.db.collection('memory_sessions')
        const factDocs = await memorySessionCollection
          .find({
            _id: {
              $in: record.facts.map(
                (id: any) => new server.mongoose.Types.ObjectId(id),
              ),
            },
          })
          .toArray()

        factsWithContent = factDocs.map((doc: any) => ({
          _id: doc._id.toString(),
          content: doc.content || '',
          createdAt: doc.createdAt?.toISOString(),
          updatedAt: doc.updatedAt?.toISOString(),
        }))
      }

      // Process unabsorbed_memory_ids array
      if (
        record.unabsorbed_memory_ids &&
        Array.isArray(record.unabsorbed_memory_ids)
      ) {
        const memorySessionCollection =
          server.mongoose.connection.db.collection('memory_sessions')
        const unabsorbedDocs = await memorySessionCollection
          .find({
            _id: {
              $in: record.unabsorbed_memory_ids.map(
                (id: any) => new server.mongoose.Types.ObjectId(id),
              ),
            },
          })
          .toArray()

        unabsorbedWithContent = unabsorbedDocs.map((doc: any) => ({
          _id: doc._id.toString(),
          content: doc.content || '',
          createdAt: doc.createdAt?.toISOString(),
          updatedAt: doc.updatedAt?.toISOString(),
        }))
      }

      processedRecords.push({
        ...record,
        _id: record._id.toString(),
        facts: factsWithContent,
        unabsorbed_memory_ids: unabsorbedWithContent,
      })
    }

    return reply.status(200).send({
      shards: processedRecords,
    })
  } catch (error) {
    server.log.error({ err: error }, 'Error retrieving memory agent:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// Helper function: update_memory_agent
export const updateMemoryAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId, memoryAgentId } = request.params as {
    agentId: string
    memoryAgentId: string
  }
  const updates = request.body as Record<string, any>
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_agent')
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    // Check if we're updating fields that require invalidating fully_formed_memory
    const invalidatingFields = [
      'content',
      'unabsorbed_memory_ids',
      'facts',
      'extraction_prompt',
    ]
    const shouldInvalidate = Object.keys(updates).some(key =>
      invalidatingFields.includes(key),
    )

    const finalUpdates = shouldInvalidate
      ? { ...updates, fully_formed_memory: null }
      : updates

    // Ensure we're only updating a memory_agent document that belongs to this agent
    const result = await memoryCollection.updateOne(
      {
        _id: new server.mongoose.Types.ObjectId(memoryAgentId),
        agent_id: agentObjectId,
      },
      { $set: finalUpdates },
    )

    if (result.matchedCount === 0) {
      return reply
        .status(404)
        .send({ error: 'Memory agent document not found or access denied' })
    }

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error updating memory agent:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// Helper function: remove memory from memory_agent arrays
export const removeMemoryFromAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId, memoryAgentId, memoryId } = request.params as {
    agentId: string
    memoryAgentId: string
    memoryId: string
  }
  const { arrayField } = request.body as {
    arrayField: 'facts' | 'unabsorbed_memory_ids'
  }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_agent')
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    const result = await memoryCollection.updateOne(
      {
        _id: new server.mongoose.Types.ObjectId(memoryAgentId),
        agent_id: agentObjectId,
      },
      {
        $pull: {
          [arrayField]: new server.mongoose.Types.ObjectId(memoryId),
        },
        $set: {
          fully_formed_memory: null,
        },
      },
    )

    if (result.matchedCount === 0) {
      return reply
        .status(404)
        .send({ error: 'Memory agent document not found or access denied' })
    }

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error removing memory from agent:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// Helper function: retrieve_memory_session
export const retrieveMemorySession = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { memoryId } = request.params as { memoryId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const sessionMemoryCollection =
      server.mongoose.connection.db.collection('memory_sessions')

    const memoryRecord = await sessionMemoryCollection.findOne({
      _id: new server.mongoose.Types.ObjectId(memoryId),
      related_users: new server.mongoose.Types.ObjectId(userId),
    })

    if (!memoryRecord) {
      return reply.status(404).send({ error: 'Memory session not found' })
    }

    return reply.status(200).send(memoryRecord)
  } catch (error) {
    server.log.error({ err: error }, 'Error retrieving memory session:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// Helper function: update_memory_user
export const updateMemoryUser = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const updates = request.body as Record<string, any>
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_user')
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    // Check if we're updating fields that require invalidating fully_formed_memory
    const invalidatingFields = ['content', 'unabsorbed_memory_ids']
    const shouldInvalidate = Object.keys(updates).some(key =>
      invalidatingFields.includes(key),
    )

    const finalUpdates = shouldInvalidate
      ? { ...updates, fully_formed_memory: null }
      : updates

    await memoryCollection.updateOne(
      {
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
      },
      { $set: finalUpdates },
      { upsert: true },
    )

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error updating memory user:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

// Helper function: update_memory_session
export const updateMemorySession = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { memoryId } = request.params as { memoryId: string }
  const updates = request.body as Record<string, any>
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({
      error: 'Authentication required',
      message: 'You must be logged in to update memory sessions',
    })
  }

  if (!memoryId) {
    return reply.status(400).send({
      error: 'Invalid request',
      message: 'Memory session ID is required',
    })
  }

  try {
    const sessionMemoryCollection =
      server.mongoose.connection.db.collection('memory_sessions')

    const result = await sessionMemoryCollection.updateOne(
      { _id: new server.mongoose.Types.ObjectId(memoryId) },
      { $set: updates },
    )

    if (result.matchedCount === 0) {
      return reply.status(404).send({
        error: 'Memory session not found',
        message: `No memory session found with ID: ${memoryId}`,
      })
    }

    // If we updated the content field, invalidate related memories
    if (updates.content !== undefined) {
      await invalidateFullyFormedMemories(server, memoryId)
    }

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error updating memory session:')

    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('ObjectId')) {
        return reply.status(400).send({
          error: 'Invalid memory ID',
          message: 'The provided memory session ID is not valid',
        })
      }
      if (error.message.includes('validation')) {
        return reply.status(400).send({
          error: 'Validation error',
          message: 'The update data contains invalid values',
        })
      }
    }

    return reply.status(500).send({
      error: 'Server error',
      message: 'Failed to update memory session due to an internal error',
    })
  }
}

// Remove unabsorbed memory from memory_user
export const removeUnabsorbedMemory = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId, memoryId } = request.params as {
    agentId: string
    memoryId: string
  }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_user')
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    await memoryCollection.updateOne(
      {
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
      },
      {
        $pull: {
          unabsorbed_memory_ids: new server.mongoose.Types.ObjectId(memoryId),
        },
        $set: {
          fully_formed_memory: null,
        },
      },
    )

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error removing unabsorbed directive:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const createMemoryAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const { shard_name, extraction_prompt } = request.body as {
    shard_name: string
    extraction_prompt: string
  }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  if (!shard_name || shard_name.trim() === '') {
    return reply.status(400).send({ error: 'Shard name is required' })
  }

  if (!extraction_prompt || extraction_prompt.trim() === '') {
    return reply.status(400).send({ error: 'Extraction prompt is required' })
  }

  if (shard_name.length > 50) {
    return reply
      .status(400)
      .send({ error: 'Shard name cannot exceed 50 characters' })
  }

  if (extraction_prompt.length > MEMORY_LIMITS.EXTRACTION_PROMPT_MAX_CHARS) {
    return reply.status(400).send({
      error: `Extraction prompt cannot exceed ${MEMORY_LIMITS.EXTRACTION_PROMPT_MAX_CHARS} characters`,
    })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_agent')
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    // Check if a shard with this name already exists for this agent
    const existingShard = await memoryCollection.findOne({
      agent_id: agentObjectId,
      shard_name: shard_name,
    })

    if (existingShard) {
      return reply
        .status(400)
        .send({ error: 'A shard with this name already exists for this agent' })
    }

    // Create the new memory agent shard
    const newShard = {
      agent_id: agentObjectId,
      shard_name: shard_name.trim(),
      extraction_prompt: extraction_prompt.trim(),
      content: '',
      is_active: true,
      facts: [],
      unabsorbed_memory_ids: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      fully_formed_memory: null,
      last_updated_at: new Date(),
    }

    const result = await memoryCollection.insertOne(newShard)

    return reply.status(200).send({
      success: true,
      shard_id: result.insertedId.toString(),
      message: 'Collective Memory Shard created successfully',
    })
  } catch (error) {
    server.log.error({ err: error }, 'Error creating memory agent shard:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const updateUserMemoryEnabled = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Params: { agentId: string }
    Body: { user_memory_enabled: boolean }
  }>,
  reply: FastifyReply,
) => {
  const { agentId } = request.params
  const { user_memory_enabled } = request.body

  try {
    // Validate agent access
    const { error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    // Permission check is handled by validateAgentAccess (same as other memory operations)

    // Update the agent's user_memory_enabled field in users3 collection
    const updateResult = await Agent.updateOne(
      { _id: agentId },
      {
        $set: {
          user_memory_enabled: user_memory_enabled,
          updatedAt: new Date(),
        },
      },
    )

    if (updateResult.matchedCount === 0) {
      return reply.status(404).send({ error: 'Agent not found' })
    }

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error(
      { err: error },
      'Error updating user memory enabled status:',
    )
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const getAgentMemoryContext = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)
    let userMemoryContent = ''
    let collectiveMemoryShards: Array<{ shard_name: string; content: string }> =
      []

    // Query user memory only if user_memory_enabled is true
    if (agent?.user_memory_enabled) {
      const memoryUserCollection =
        server.mongoose.connection.db.collection('memory_user')
      const userMemory = await memoryUserCollection.findOne({
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
      })

      userMemoryContent = userMemory?.fully_formed_memory || ''
    }

    // Query collective memory (active shards)
    const memoryAgentCollection =
      server.mongoose.connection.db.collection('memory_agent')
    const activeShards = await memoryAgentCollection
      .find({
        agent_id: agentObjectId,
        is_active: true,
      })
      .toArray()

    collectiveMemoryShards = activeShards
      .filter(
        shard => shard.fully_formed_memory && shard.fully_formed_memory.trim(),
      )
      .map(shard => ({
        shard_name: shard.shard_name || 'unnamed_shard',
        content: shard.fully_formed_memory,
      }))

    return reply.status(200).send({
      userMemory: userMemoryContent,
      collectiveMemory: collectiveMemoryShards,
    })
  } catch (error) {
    server.log.error({ err: error }, 'Error fetching agent memory context:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const getAgentMemoryContext = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)
    let userMemoryContent = ''
    let collectiveMemoryShards: Array<{ shard_name: string; content: string }> =
      []

    // Query user memory only if user_memory_enabled is true
    if (agent?.user_memory_enabled) {
      const memoryUserCollection =
        server.mongoose.connection.db.collection('memory_user')
      const userMemory = await memoryUserCollection.findOne({
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
      })

      userMemoryContent = userMemory?.fully_formed_memory || ''
    }

    // Query collective memory (active shards)
    const memoryAgentCollection =
      server.mongoose.connection.db.collection('memory_agent')
    const activeShards = await memoryAgentCollection
      .find({
        agent_id: agentObjectId,
        is_active: true,
      })
      .toArray()

    collectiveMemoryShards = activeShards
      .filter(
        shard => shard.fully_formed_memory && shard.fully_formed_memory.trim(),
      )
      .map(shard => ({
        shard_name: shard.shard_name || 'unnamed_shard',
        content: shard.fully_formed_memory,
      }))

    return reply.status(200).send({
      userMemory: userMemoryContent,
      collectiveMemory: collectiveMemoryShards,
    })
  } catch (error) {
    server.log.error('Error fetching agent memory context:', error)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}
