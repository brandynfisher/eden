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

/**
 * GET /v2/agents/:agentId/memory2
 * Get user-scoped memory2 data (consolidated content + unabsorbed reflections)
 */
export const getMemory2User = async (
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
    const userObjectId = new server.mongoose.Types.ObjectId(userId)

    // Get consolidated memory for user scope
    const consolidatedCollection = server.mongoose.connection.db.collection(
      'memory2_consolidated',
    )
    const consolidated = await consolidatedCollection.findOne({
      scope_type: 'user',
      agent_id: agentObjectId,
      user_id: userObjectId,
    })

    // Get unabsorbed reflections for user scope
    const reflectionsCollection = server.mongoose.connection.db.collection(
      'memory2_reflections',
    )
    const reflections = await reflectionsCollection
      .find({
        agent_id: agentObjectId,
        user_id: userObjectId,
        scope: 'user',
        absorbed: false,
      })
      .sort({ formed_at: -1 })
      .toArray()

    const formattedReflections = reflections.map(r => ({
      _id: r._id.toString(),
      content: r.content || '',
      formed_at: r.formed_at?.toISOString() || r.createdAt?.toISOString(),
    }))

    return reply.status(200).send({
      consolidated_content: consolidated?.consolidated_content || '',
      last_consolidated_at:
        consolidated?.last_consolidated_at?.toISOString() || null,
      unabsorbed_reflections: formattedReflections,
    })
  } catch (error) {
    server.log.error({ err: error }, 'Error fetching memory2 user data:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

/**
 * POST /v2/agents/:agentId/memory2
 * Save user-scoped consolidated memory content
 */
export const saveMemory2User = async (
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

    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)
    const userObjectId = new server.mongoose.Types.ObjectId(userId)

    const consolidatedCollection = server.mongoose.connection.db.collection(
      'memory2_consolidated',
    )

    await consolidatedCollection.updateOne(
      {
        scope_type: 'user',
        agent_id: agentObjectId,
        user_id: userObjectId,
      },
      {
        $set: {
          consolidated_content: content || '',
          updatedAt: new Date(),
        },
        $setOnInsert: {
          scope_type: 'user',
          agent_id: agentObjectId,
          user_id: userObjectId,
          word_limit: 400,
          unabsorbed_ids: [],
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error saving memory2 user data:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

/**
 * GET /v2/agents/:agentId/memory2-agent
 * Get agent-scoped memory2 data (consolidated content + unabsorbed reflections + facts)
 */
export const getMemory2Agent = async (
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

    // Get consolidated memory for agent scope
    const consolidatedCollection = server.mongoose.connection.db.collection(
      'memory2_consolidated',
    )
    const consolidated = await consolidatedCollection.findOne({
      scope_type: 'agent',
      agent_id: agentObjectId,
    })

    // Get unabsorbed reflections for agent scope
    const reflectionsCollection = server.mongoose.connection.db.collection(
      'memory2_reflections',
    )
    const reflections = await reflectionsCollection
      .find({
        agent_id: agentObjectId,
        scope: 'agent',
        absorbed: false,
      })
      .sort({ formed_at: -1 })
      .toArray()

    const formattedReflections = reflections.map(r => ({
      _id: r._id.toString(),
      content: r.content || '',
      formed_at: r.formed_at?.toISOString() || r.createdAt?.toISOString(),
    }))

    // Get facts with agent scope
    const factsCollection =
      server.mongoose.connection.db.collection('memory2_facts')
    const facts = await factsCollection
      .find({
        agent_id: agentObjectId,
        scope: 'agent',
      })
      .sort({ formed_at: -1 })
      .limit(100)
      .toArray()

    const formattedFacts = facts.map(f => ({
      _id: f._id.toString(),
      content: f.content || '',
      formed_at: f.formed_at?.toISOString() || f.createdAt?.toISOString(),
      access_count: f.access_count || 0,
    }))

    return reply.status(200).send({
      consolidated_content: consolidated?.consolidated_content || '',
      last_consolidated_at:
        consolidated?.last_consolidated_at?.toISOString() || null,
      unabsorbed_reflections: formattedReflections,
      facts: formattedFacts,
    })
  } catch (error) {
    server.log.error({ err: error }, 'Error fetching memory2 agent data:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

/**
 * POST /v2/agents/:agentId/memory2-agent
 * Save agent-scoped consolidated memory content
 */
export const saveMemory2Agent = async (
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
    if (error || !agent) {
      return reply.status(404).send({ error: error || 'Agent not found' })
    }

    // Check if user has edit access to this agent
    if (agent.owner.toString() !== userId?.toString()) {
      return reply
        .status(403)
        .send({ error: 'Not authorized to edit this agent memory' })
    }

    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    const consolidatedCollection = server.mongoose.connection.db.collection(
      'memory2_consolidated',
    )

    await consolidatedCollection.updateOne(
      {
        scope_type: 'agent',
        agent_id: agentObjectId,
      },
      {
        $set: {
          consolidated_content: content || '',
          updatedAt: new Date(),
        },
        $setOnInsert: {
          scope_type: 'agent',
          agent_id: agentObjectId,
          word_limit: 400,
          unabsorbed_ids: [],
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error saving memory2 agent data:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

/**
 * PATCH /v2/memory2-reflections/:reflectionId
 * Update a reflection's content
 */
export const updateMemory2Reflection = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { reflectionId } = request.params as { reflectionId: string }
  const { content } = request.body as { content: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const reflectionsCollection = server.mongoose.connection.db.collection(
      'memory2_reflections',
    )

    // First get the reflection to check permissions
    const reflection = await reflectionsCollection.findOne({
      _id: new server.mongoose.Types.ObjectId(reflectionId),
    })

    if (!reflection) {
      return reply.status(404).send({ error: 'Reflection not found' })
    }

    // For user-scoped reflections, verify user owns it
    // For agent-scoped reflections, verify user owns the agent
    if (reflection.scope === 'user') {
      if (reflection.user_id?.toString() !== userId?.toString()) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to edit this reflection' })
      }
    } else if (reflection.scope === 'agent') {
      const agent = await Agent.findById(reflection.agent_id)
      if (!agent || agent.owner.toString() !== userId?.toString()) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to edit this reflection' })
      }
    }

    await reflectionsCollection.updateOne(
      { _id: new server.mongoose.Types.ObjectId(reflectionId) },
      {
        $set: {
          content: content || '',
          updatedAt: new Date(),
        },
      },
    )

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error updating memory2 reflection:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

/**
 * DELETE /v2/memory2-reflections/:reflectionId
 * Delete a reflection
 */
export const deleteMemory2Reflection = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { reflectionId } = request.params as { reflectionId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const reflectionsCollection = server.mongoose.connection.db.collection(
      'memory2_reflections',
    )

    // First get the reflection to check permissions
    const reflection = await reflectionsCollection.findOne({
      _id: new server.mongoose.Types.ObjectId(reflectionId),
    })

    if (!reflection) {
      return reply.status(404).send({ error: 'Reflection not found' })
    }

    // For user-scoped reflections, verify user owns it
    // For agent-scoped reflections, verify user owns the agent
    if (reflection.scope === 'user') {
      if (reflection.user_id?.toString() !== userId?.toString()) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to delete this reflection' })
      }
    } else if (reflection.scope === 'agent') {
      const agent = await Agent.findById(reflection.agent_id)
      if (!agent || agent.owner.toString() !== userId?.toString()) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to delete this reflection' })
      }
    }

    await reflectionsCollection.deleteOne({
      _id: new server.mongoose.Types.ObjectId(reflectionId),
    })

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error deleting memory2 reflection:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

/**
 * PATCH /v2/memory2-facts/:factId
 * Update a fact's content
 */
export const updateMemory2Fact = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { factId } = request.params as { factId: string }
  const { content } = request.body as { content: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const factsCollection =
      server.mongoose.connection.db.collection('memory2_facts')

    // First get the fact to check permissions
    const fact = await factsCollection.findOne({
      _id: new server.mongoose.Types.ObjectId(factId),
    })

    if (!fact) {
      return reply.status(404).send({ error: 'Fact not found' })
    }

    // Check if user has access to this fact
    // User-scoped facts: user must own it
    // Agent-scoped facts: user must own the agent
    if (fact.user_id) {
      if (fact.user_id.toString() !== userId?.toString()) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to edit this fact' })
      }
    } else {
      const agent = await Agent.findById(fact.agent_id)
      if (!agent || agent.owner.toString() !== userId?.toString()) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to edit this fact' })
      }
    }

    // Update the content and compute new hash
    const crypto = require('crypto')
    const newHash = crypto
      .createHash('md5')
      .update(content || '')
      .digest('hex')

    await factsCollection.updateOne(
      { _id: new server.mongoose.Types.ObjectId(factId) },
      {
        $set: {
          content: content || '',
          hash: newHash,
          previous_content: fact.content,
          updated_at: new Date(),
          updatedAt: new Date(),
        },
        $inc: { version: 1 },
      },
    )

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error updating memory2 fact:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

/**
 * DELETE /v2/memory2-facts/:factId
 * Delete a fact
 */
export const deleteMemory2Fact = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { factId } = request.params as { factId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const factsCollection =
      server.mongoose.connection.db.collection('memory2_facts')

    // First get the fact to check permissions
    const fact = await factsCollection.findOne({
      _id: new server.mongoose.Types.ObjectId(factId),
    })

    if (!fact) {
      return reply.status(404).send({ error: 'Fact not found' })
    }

    // Check if user has access to delete this fact
    if (fact.user_id) {
      if (fact.user_id.toString() !== userId?.toString()) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to delete this fact' })
      }
    } else {
      const agent = await Agent.findById(fact.agent_id)
      if (!agent || agent.owner.toString() !== userId?.toString()) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to delete this fact' })
      }
    }

    await factsCollection.deleteOne({
      _id: new server.mongoose.Types.ObjectId(factId),
    })

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, 'Error deleting memory2 fact:')
    return reply.status(500).send({ error: 'Internal server error' })
  }
}
