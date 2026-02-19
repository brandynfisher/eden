import { Agent } from '../models/Agent'
import { createIdOrSlugQuery } from '../utils/mongoUtils'
import { ensureMemoryDefaults } from './agentMemory2Controller'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

// Constants matching Python backend (constants.py)
const FACTS_FIFO_LIMIT = 40
const FACTS_FIFO_MAX_AGE_HOURS = 168 // 7 days
const REFLECTIONS_LIMIT = 20

// Helper to match an ID field that could be stored as string or ObjectId
const matchIdField = (objectId: any) => ({
  $in: [objectId, objectId.toString()],
})

const createAgentObjectId = (agentId: string, agentDoc: any, mongoose: any) => {
  return mongoose.Types.ObjectId.isValid(agentId)
    ? new mongoose.Types.ObjectId(agentId)
    : new mongoose.Types.ObjectId(agentDoc._id)
}

/**
 * Wraps any async query in try/catch, returns fallback on failure
 */
async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

/**
 * Format temporal age for a date, matching Python's format_temporal_age()
 */
function formatTemporalAge(date: Date): string {
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffHours < 1) {
    return `${Math.max(1, diffMinutes)}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
  } else {
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`
  }
}

/**
 * Fetch FIFO facts matching Python's get_recent_facts_fifo()
 */
async function fetchFactsFifo(
  db: any,
  agentObjectId: any,
  userObjectId: any,
  agentMemoryEnabled: boolean,
  userMemoryEnabled: boolean,
): Promise<any[]> {
  const cutoff = new Date(Date.now() - FACTS_FIFO_MAX_AGE_HOURS * 3600000)
  const factsCollection = db.collection('memory2_facts')

  let query: any
  if (agentMemoryEnabled && userMemoryEnabled) {
    query = {
      agent_id: matchIdField(agentObjectId),
      formed_at: { $gte: cutoff },
      $or: [
        { scope: 'agent' },
        { scope: 'user', user_id: matchIdField(userObjectId) },
      ],
    }
  } else if (agentMemoryEnabled) {
    query = {
      agent_id: matchIdField(agentObjectId),
      formed_at: { $gte: cutoff },
      scope: 'agent',
    }
  } else {
    query = {
      agent_id: matchIdField(agentObjectId),
      formed_at: { $gte: cutoff },
      scope: 'user',
      user_id: matchIdField(userObjectId),
    }
  }

  return factsCollection
    .find(query)
    .sort({ formed_at: -1 })
    .limit(FACTS_FIFO_LIMIT)
    .toArray()
}

/**
 * Build memory XML matching Python's _build_memory_xml() from context_assembly.py
 */
function buildMemoryXml(params: {
  agentConsolidated: any | null
  userConsolidated: any | null
  agentReflections: any[]
  userReflections: any[]
  facts: any[]
  agentMemoryEnabled: boolean
  userMemoryEnabled: boolean
}): string {
  const {
    agentConsolidated,
    userConsolidated,
    agentReflections,
    userReflections,
    facts,
    agentMemoryEnabled,
    userMemoryEnabled,
  } = params

  const sections: string[] = []

  // Agent memory section
  if (agentMemoryEnabled) {
    const agentParts: string[] = []
    const consolidated = agentConsolidated?.consolidated_content
    if (consolidated) {
      agentParts.push(`    <Consolidated>${consolidated}</Consolidated>`)
    }
    if (agentReflections.length > 0) {
      const lines = agentReflections.map(r => `- ${r.content || ''}`).join('\n')
      agentParts.push(
        `    <RecentReflections>\n${lines}\n    </RecentReflections>`,
      )
    }
    if (agentParts.length > 0) {
      sections.push(
        `  <AgentMemory>\n${agentParts.join('\n')}\n  </AgentMemory>`,
      )
    }
  }

  // User memory section
  if (userMemoryEnabled) {
    const userParts: string[] = []
    const consolidated = userConsolidated?.consolidated_content
    if (consolidated) {
      userParts.push(`    <Consolidated>${consolidated}</Consolidated>`)
    }
    if (userReflections.length > 0) {
      const lines = userReflections.map(r => `- ${r.content || ''}`).join('\n')
      userParts.push(
        `    <RecentReflections>\n${lines}\n    </RecentReflections>`,
      )
    }
    if (userParts.length > 0) {
      sections.push(`  <UserMemory>\n${userParts.join('\n')}\n  </UserMemory>`)
    }
  }

  // Facts section
  if (facts.length > 0) {
    const lines = facts
      .map(f => {
        const date = f.updated_at
          ? new Date(f.updated_at)
          : f.formed_at
          ? new Date(f.formed_at)
          : null
        const age = date ? ` (${formatTemporalAge(date)})` : ''
        return `- [${f.scope || 'agent'}] ${f.content || ''}${age}`
      })
      .join('\n')
    sections.push(`  <Facts>\n${lines}\n  </Facts>`)
  }

  if (sections.length === 0) {
    return ''
  }

  return `<MemoryContext>\n${sections.join('\n')}\n</MemoryContext>`
}

/**
 * Assemble the complete memory context for an agent + user pair.
 * Returns the ElevenLabs dynamic variables: agent_system_prompt and first_message.
 */
async function assembleMemoryContext(
  server: FastifyInstance,
  agentId: string,
  userId: string,
): Promise<{ agent_system_prompt: string; first_message: string }> {
  // Phase 1: Fetch agent data
  let agentName = ''
  let description = ''
  let persona = ''
  let userMemoryEnabled = false
  let agentMemoryEnabled = false
  let agentDoc: any = null

  try {
    const agent = await Agent.findOne(createIdOrSlugQuery(agentId)).populate({
      path: 'owner',
      select: 'subscriptionTier',
    })
    if (agent && !agent.deleted) {
      agentDoc = agent
      agentName = agent.name || ''
      description = agent.description || ''
      persona = agent.persona || ''
      const defaults = await ensureMemoryDefaults(agent)
      userMemoryEnabled = defaults.user_memory_enabled
      agentMemoryEnabled = defaults.agent_memory_enabled
    }
  } catch (err) {
    server.log.error({ err }, 'Failed to fetch agent data for memory context')
    return { agent_system_prompt: '', first_message: '' }
  }

  if (!agentDoc) {
    return { agent_system_prompt: '', first_message: '' }
  }

  // Phase 2: Fetch memory data in parallel with graceful degradation
  const agentObjectId = createAgentObjectId(agentId, agentDoc, server.mongoose)
  const userObjectId = new server.mongoose.Types.ObjectId(userId)
  const db = server.mongoose.connection.db

  const [
    agentConsolidated,
    userConsolidated,
    agentReflections,
    userReflections,
    facts,
  ] = await Promise.all([
    agentMemoryEnabled
      ? safeQuery(
          () =>
            db.collection('memory2_consolidated').findOne({
              scope: 'agent',
              agent_id: matchIdField(agentObjectId),
            }),
          null,
        )
      : null,
    userMemoryEnabled
      ? safeQuery(
          () =>
            db.collection('memory2_consolidated').findOne({
              scope: 'user',
              agent_id: matchIdField(agentObjectId),
              user_id: matchIdField(userObjectId),
            }),
          null,
        )
      : null,
    agentMemoryEnabled
      ? safeQuery(
          () =>
            db
              .collection('memory2_reflections')
              .find({
                agent_id: matchIdField(agentObjectId),
                scope: 'agent',
                absorbed: false,
              })
              .sort({ createdAt: -1 })
              .limit(REFLECTIONS_LIMIT)
              .toArray()
              .then(docs => docs.reverse()),
          [],
        )
      : [],
    userMemoryEnabled
      ? safeQuery(
          () =>
            db
              .collection('memory2_reflections')
              .find({
                agent_id: matchIdField(agentObjectId),
                scope: 'user',
                absorbed: false,
                user_id: matchIdField(userObjectId),
              })
              .sort({ createdAt: -1 })
              .limit(REFLECTIONS_LIMIT)
              .toArray()
              .then(docs => docs.reverse()),
          [],
        )
      : [],
    agentMemoryEnabled || userMemoryEnabled
      ? safeQuery(
          () =>
            fetchFactsFifo(
              db,
              agentObjectId,
              userObjectId,
              agentMemoryEnabled,
              userMemoryEnabled,
            ),
          [],
        )
      : [],
  ])

  // Phase 3: Build memory XML
  const memoryXml = buildMemoryXml({
    agentConsolidated,
    userConsolidated,
    agentReflections,
    userReflections,
    facts,
    agentMemoryEnabled,
    userMemoryEnabled,
  })

  // Phase 4: Build agent_system_prompt
  let systemPrompt = `You are ${agentName}.

## Description
${description}

## Persona
${persona}`

  if (memoryXml) {
    systemPrompt += `\n\n## Memory\n${memoryXml}`
  }

  return {
    agent_system_prompt: systemPrompt.trim(),
    first_message: '',
  }
}

/**
 * GET /v2/agents/:agentId/memory-context
 * Get assembled memory context for realtime voice conversations.
 */
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

  const result = await assembleMemoryContext(server, agentId, userId.toString())
  return reply.status(200).send(result)
}
