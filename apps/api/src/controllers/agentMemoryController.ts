import { MEMORY_LIMITS } from '../lib/constants'
import { Agent, AgentDocument } from '../models/Agent'
import { createIdOrSlugQuery } from '../utils/mongoUtils'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const validateAgentAccess = async (agentId: string, populateOwner = false) => {
  const query = createIdOrSlugQuery(agentId)
  const agent = populateOwner
    ? await Agent.findOne(query).populate('owner', 'subscriptionTier')
    : await Agent.findOne(query)

  if (!agent || agent.deleted) {
    return { agent: null, error: 'Agent not found' }
  }

  return { agent, error: null }
}

/**
 * Get the default value for agent_memory_enabled based on owner's subscription tier.
 * Free users (tier 0) default to false, paid users (tier > 0) default to true.
 */
export const getAgentMemoryEnabledDefault = (
  ownerSubscriptionTier: number | undefined,
): boolean => {
  const tier = ownerSubscriptionTier ?? SubscriptionTier.Free
  return tier > SubscriptionTier.Free
}

/**
 * Ensure memory fields have proper defaults and persist them to DB if they were undefined.
 * - user_memory_enabled: defaults to true
 * - agent_memory_enabled: defaults to true for paid users (subscription tier > 0), false for free users
 *
 * IMPORTANT: The agent must have owner populated with subscriptionTier for this to work correctly.
 */
export const ensureMemoryDefaults = async (
  agent: AgentDocument,
): Promise<{ user_memory_enabled: boolean; agent_memory_enabled: boolean }> => {
  const updates: Record<string, boolean> = {}

  // Default for user_memory_enabled is true
  let userMemoryEnabled = agent.user_memory_enabled
  if (userMemoryEnabled === undefined || userMemoryEnabled === null) {
    userMemoryEnabled = true
    updates.user_memory_enabled = true
  }

  // Default for agent_memory_enabled depends on owner subscription tier
  let agentMemoryEnabled = agent.agent_memory_enabled
  if (agentMemoryEnabled === undefined || agentMemoryEnabled === null) {
    const ownerTier = (agent.owner as any)?.subscriptionTier
    agentMemoryEnabled = getAgentMemoryEnabledDefault(ownerTier)
    updates.agent_memory_enabled = agentMemoryEnabled
  }

  // Persist defaults to DB if any fields were undefined
  if (Object.keys(updates).length > 0) {
    await Agent.updateOne(
      { _id: agent._id },
      { $set: { ...updates, updatedAt: new Date() } },
    )
  }

  return {
    user_memory_enabled: userMemoryEnabled,
    agent_memory_enabled: agentMemoryEnabled,
  }
}

const createAgentObjectId = (agentId: string, agentDoc: any, mongoose: any) => {
  return mongoose.Types.ObjectId.isValid(agentId)
    ? new mongoose.Types.ObjectId(agentId)
    : new mongoose.Types.ObjectId(agentDoc._id)
}

// Helper function to call Eve API to regenerate agent memory
const regenerateAgentMemory = async (
  server: FastifyInstance,
  shardId: string | { toString(): string },
) => {
  try {
    const shardIdStr =
      typeof shardId === 'string' ? shardId : shardId.toString()
    await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/memory/regenerate-agent-memory`,
      { shard_id: shardIdStr },
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )
  } catch (error) {
    server.log.error(
      { err: error, shardId },
      'Error calling regenerate agent memory API',
    )
  }
}

// Helper function to call Eve API to regenerate user memory
const regenerateUserMemory = async (
  server: FastifyInstance,
  agentId: string | { toString(): string },
  userId: string | { toString(): string },
) => {
  try {
    const agentIdStr =
      typeof agentId === 'string' ? agentId : agentId.toString()
    const userIdStr = typeof userId === 'string' ? userId : userId.toString()
    await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/memory/regenerate-user-memory`,
      { agent_id: agentIdStr, user_id: userIdStr },
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )
  } catch (error) {
    server.log.error(
      { err: error, agentId, userId },
      'Error calling regenerate user memory API',
    )
  }
}

// Helper function to regenerate fully_formed_memory for related UserMemory/AgentMemory documents
// This is fire-and-forget - it triggers regeneration but doesn't wait for completion
const regenerateRelatedMemories = async (
  server: FastifyInstance,
  sessionMemoryId: string,
) => {
  try {
    const sessionMemory = await server.mongoose.connection.db
      .collection('memory_sessions')
      .findOne({ _id: new server.mongoose.Types.ObjectId(sessionMemoryId) })

    if (!sessionMemory) return

    const { memory_type, agent_id, related_users, shard_id } = sessionMemory

    // Handle directive -> regenerate UserMemory (fire-and-forget)
    if (memory_type === 'directive' && related_users) {
      const users = Array.isArray(related_users)
        ? related_users
        : [related_users]
      for (const userId of users) {
        regenerateUserMemory(server, agent_id.toString(), userId.toString())
      }
    }

    // Handle fact/suggestion -> regenerate AgentMemory (fire-and-forget)
    if (memory_type === 'fact' || memory_type === 'suggestion') {
      if (shard_id) {
        regenerateAgentMemory(server, shard_id.toString())
      } else {
        const shards = await server.mongoose.connection.db
          .collection('memory_agent')
          .find({
            agent_id,
            $or: [
              {
                unabsorbed_memory_ids: new server.mongoose.Types.ObjectId(
                  sessionMemoryId,
                ),
              },
              { facts: new server.mongoose.Types.ObjectId(sessionMemoryId) },
            ],
          })
          .toArray()

        for (const shard of shards) {
          regenerateAgentMemory(server, shard._id.toString())
        }
      }
    }
  } catch (error) {
    server.log.error({ err: error }, 'Error regenerating related memories')
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

    const result = await memoryCollection.updateOne(
      {
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          content: content || '',
        },
        $setOnInsert: {
          agent_id: agentObjectId,
          user_id: new server.mongoose.Types.ObjectId(userId),
          agent_owner: null,
          unabsorbed_memory_ids: [],
          fully_formed_memory: null,
        },
      },
      { upsert: true },
    )

    // Regenerate fully_formed_memory if:
    // - This was an update (existing memory modified)
    // - This was an insert with non-empty content (new memory with content)
    const shouldRegenerate =
      result.matchedCount > 0 || (result.upsertedCount > 0 && content?.trim())

    if (shouldRegenerate) {
      // Fire-and-forget: don't wait for regeneration to complete
      regenerateUserMemory(server, agentObjectId, userId)
    }

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

    // Check if we're updating fields that require regenerating fully_formed_memory
    const regeneratingFields = [
      'content',
      'unabsorbed_memory_ids',
      'facts',
      'extraction_prompt',
    ]
    const shouldRegenerate = Object.keys(updates).some(key =>
      regeneratingFields.includes(key),
    )

    // Ensure we're only updating a memory_agent document that belongs to this agent
    const result = await memoryCollection.updateOne(
      {
        _id: new server.mongoose.Types.ObjectId(memoryAgentId),
        agent_id: agentObjectId,
      },
      { $set: updates },
    )

    if (result.matchedCount === 0) {
      return reply
        .status(404)
        .send({ error: 'Memory agent document not found or access denied' })
    }

    // Regenerate fully_formed_memory if relevant fields were updated
    if (shouldRegenerate) {
      // Fire-and-forget: don't wait for regeneration to complete
      regenerateAgentMemory(server, memoryAgentId)
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
      },
    )

    if (result.matchedCount === 0) {
      return reply
        .status(404)
        .send({ error: 'Memory agent document not found or access denied' })
    }

    // Regenerate fully_formed_memory after removing the memory (fire-and-forget)
    regenerateAgentMemory(server, memoryAgentId)

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

    // Check if we're updating fields that require regenerating fully_formed_memory
    const regeneratingFields = ['content', 'unabsorbed_memory_ids']
    const shouldRegenerate = Object.keys(updates).some(key =>
      regeneratingFields.includes(key),
    )

    await memoryCollection.updateOne(
      {
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
      },
      { $set: updates },
      { upsert: true },
    )

    // Regenerate fully_formed_memory if relevant fields were updated
    if (shouldRegenerate) {
      // Fire-and-forget: don't wait for regeneration to complete
      regenerateUserMemory(server, agentObjectId, userId)
    }

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

    // If we updated the content field, regenerate related memories (fire-and-forget)
    if (updates.content !== undefined) {
      regenerateRelatedMemories(server, memoryId)
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
      },
    )

    // Regenerate fully_formed_memory after removing the directive (fire-and-forget)
    regenerateUserMemory(server, agentObjectId, userId)

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

export const updateAgentMemoryEnabled = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Params: { agentId: string }
    Body: { agent_memory_enabled: boolean }
  }>,
  reply: FastifyReply,
) => {
  const { agentId } = request.params
  const { agent_memory_enabled } = request.body

  try {
    // Validate agent access
    const { error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    // Permission check is handled by validateAgentAccess (same as other memory operations)

    // Update the agent's agent_memory_enabled field in users3 collection
    const updateResult = await Agent.updateOne(
      { _id: agentId },
      {
        $set: {
          agent_memory_enabled: agent_memory_enabled,
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
      'Error updating agent memory enabled status:',
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
    // Populate owner to check subscription tier for agent_memory_enabled default
    const { agent, error } = await validateAgentAccess(agentId, true)
    if (error || !agent) {
      return reply.status(404).send({ error })
    }

    // Ensure memory defaults are set and persisted
    const { user_memory_enabled } = await ensureMemoryDefaults(agent)

    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)
    let userMemoryContent = ''
    let collectiveMemoryShards: Array<{ shard_name: string; content: string }> =
      []

    // Query user memory only if user_memory_enabled is true
    if (user_memory_enabled) {
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
