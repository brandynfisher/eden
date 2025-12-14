import { paginatedResponse, paginationProperties } from '..'
import {
  createAgent,
  createMemoryAgent,
  deleteAgent,
  deleteAgentDeployment,
  deployAgent,
  getAgent,
  getAgentCreations,
  getAgentDeployments,
  getAgentMemory,
  getAgentMemoryContext,
  getAgentPermissions,
  getAllUserDeployments,
  getAllUserTriggers,
  getDashboardData,
  getSharedAgents,
  likeAgent,
  listAgents,
  removeMemoryFromAgent,
  removeUnabsorbedMemory,
  retrieveMemoryAgent,
  retrieveMemorySession,
  retrieveMemoryUser,
  saveAgentMemory,
  unlikeAgent,
  updateAgent,
  updateAgentDeployment,
  updateAgentPermissions,
  updateMemoryAgent,
  updateMemorySession,
  updateMemoryUser,
  updateUserMemoryEnabled,
} from '../../controllers/agentController'
import {
  getAgentRealtimeSettings,
  updateAgentRealtimeSettings,
} from '../../controllers/agentRealtimeController'
import {
  createTrigger,
  deleteTrigger,
  executeTrigger,
  getDiscordChannels,
  refreshDiscordChannels,
  updateTrigger,
} from '../../controllers/agentServicesController'
import {
  createEmailDomain,
  deleteEmailDomain,
  getEmailDomain,
} from '../../controllers/emailController'
import type {
  EmailDomainBody,
  EmailDomainParams,
  EmailDomainQuery,
} from '../../controllers/emailController'
import { MEMORY_LIMITS } from '../../lib/constants'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

const agentRoutes: FastifyPluginAsync = async server => {
  server.get('/v2/agents', {
    schema: {
      tags: ['Agents'],
      summary: 'List Agents',
      description:
        'Retrieve a paginated list of agents, optionally filtered by user ID, username, or name.',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          username: { type: ['string', 'array'] },
          name: { type: 'string' },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => listAgents(request, reply),
  })

  server.get('/v2/agents/:agentId', {
    schema: {
      tags: ['Agents'],
      summary: 'Get Agent Details',
      description:
        'Retrieve detailed information about a specific agent by its ID.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      response: {
        200: {
          agent: Type.Any(),
        },
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getAgent(server, request, reply),
  })

  server.post('/v2/agents', {
    schema: {
      tags: ['Agents'],
      summary: 'Create New Agent',
      description:
        'Create a new AI agent with specified configuration, models, persona, and capabilities.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        name: Type.String(),
        key: Type.String(),
        description: Type.String(),
        image: Type.String(),
        public: Type.Optional(Type.Boolean()),
        models: Type.Optional(
          Type.Array(
            Type.Object({
              lora: Type.String(),
              use_when: Type.Optional(Type.String()),
            }),
          ),
        ),
        persona: Type.Optional(Type.String()),
        isPersonaPublic: Type.Optional(Type.Boolean()),
        greeting: Type.Optional(Type.String()),
        knowledge: Type.Optional(Type.String()),
        voice: Type.Optional(Type.String()),
        suggestions: Type.Optional(
          Type.Array(
            Type.Object({
              label: Type.String(),
              prompt: Type.String(),
            }),
          ),
        ),
        tools: Type.Optional(Type.Record(Type.String(), Type.Boolean())),
        llm_settings: Type.Optional(
          Type.Object({
            model_profile: Type.Optional(
              Type.Union([
                Type.Literal('low'),
                Type.Literal('medium'),
                Type.Literal('high'),
              ]),
            ),
            thinking_policy: Type.Optional(
              Type.Union([
                Type.Literal('auto'),
                Type.Literal('off'),
                Type.Literal('always'),
              ]),
            ),
            thinking_effort_cap: Type.Optional(
              Type.Union([
                Type.Literal('low'),
                Type.Literal('medium'),
                Type.Literal('high'),
              ]),
            ),
            thinking_effort_instructions: Type.Optional(Type.String()),
          }),
        ),
      }),
      response: {
        200: {
          agentId: Type.String(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createAgent(server, request, reply),
  })

  server.patch('/v2/agents/:agentId', {
    schema: {
      tags: ['Agents'],
      summary: 'Update Agent',
      description:
        'Update the configuration, settings, or properties of an existing agent.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      body: Type.Object({
        name: Type.Optional(Type.String()),
        key: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        image: Type.Optional(Type.String()),
        public: Type.Optional(Type.Boolean()),
        models: Type.Optional(
          Type.Array(
            Type.Object({
              lora: Type.String(),
              use_when: Type.Optional(Type.String()),
            }),
          ),
        ),
        persona: Type.Optional(Type.String()),
        isPersonaPublic: Type.Optional(Type.Boolean()),
        greeting: Type.Optional(Type.String()),
        knowledge: Type.Optional(Type.String()),
        voice: Type.Optional(Type.String()),
        suggestions: Type.Optional(
          Type.Array(
            Type.Object({
              label: Type.String(),
              prompt: Type.String(),
            }),
          ),
        ),
        owner_pays: Type.Optional(
          Type.Union([
            Type.Literal('off'),
            Type.Literal('deployments'),
            Type.Literal('full'),
            Type.Boolean(), // backward compatibility
          ]),
        ),
        tools: Type.Optional(Type.Record(Type.String(), Type.Boolean())),
        llm_settings: Type.Optional(
          Type.Object({
            model_profile: Type.Optional(
              Type.Union([
                Type.Literal('low'),
                Type.Literal('medium'),
                Type.Literal('high'),
              ]),
            ),
            thinking_policy: Type.Optional(
              Type.Union([
                Type.Literal('auto'),
                Type.Literal('off'),
                Type.Literal('always'),
              ]),
            ),
            thinking_effort_cap: Type.Optional(
              Type.Union([
                Type.Literal('low'),
                Type.Literal('medium'),
                Type.Literal('high'),
              ]),
            ),
            thinking_effort_instructions: Type.Optional(Type.String()),
          }),
        ),
      }),
      response: {
        200: Type.Object({
          agentId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateAgent(server, request, reply),
  })

  server.post('/v2/agents/:agentId/email/domain', {
    schema: {
      tags: ['Agents'],
      summary: 'Create Mailgun Domain',
      security: [{ apiKey: [] }],
      params: Type.Object({
        agentId: Type.String(),
      }),
      body: Type.Object({
        domain: Type.String(),
      }),
      response: {
        201: Type.Object({
          domain: Type.Any(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (
      request: FastifyRequest<{
        Params: EmailDomainParams
        Body: EmailDomainBody
      }>,
      reply: FastifyReply,
    ) => createEmailDomain(server, request, reply),
  })

  server.get('/v2/agents/:agentId/email/domain', {
    schema: {
      tags: ['Agents'],
      summary: 'Get Mailgun Domain',
      security: [{ apiKey: [] }],
      params: Type.Object({
        agentId: Type.String(),
      }),
      querystring: Type.Object({
        refresh: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          domain: Type.Any(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (
      request: FastifyRequest<{
        Params: EmailDomainParams
        Querystring: EmailDomainQuery
      }>,
      reply: FastifyReply,
    ) => getEmailDomain(server, request, reply),
  })

  server.delete('/v2/agents/:agentId/email/domain', {
    schema: {
      tags: ['Agents'],
      summary: 'Delete Mailgun Domain',
      security: [{ apiKey: [] }],
      params: Type.Object({
        agentId: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (
      request: FastifyRequest<{ Params: EmailDomainParams }>,
      reply: FastifyReply,
    ) => deleteEmailDomain(server, request, reply),
  })

  server.post('/v2/triggers/run', {
    schema: {
      tags: ['Triggers'],
      summary: 'Execute Trigger Now',
      description:
        'Manually execute an agent trigger immediately, bypassing its normal activation conditions.',
      hide: true,
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        trigger_id: Type.String(),
      }),
      response: {
        200: Type.Object({
          trigger_id: Type.String(),
          executed: Type.Boolean(),
          chat_response: Type.Optional(Type.Any()),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        403: Type.Object({
          message: Type.String(),
        }),
        404: Type.Object({
          message: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => executeTrigger(server, request, reply),
  })

  // Session-based trigger routes (without agent requirement)
  server.post('/v2/triggers', {
    schema: {
      tags: ['Triggers'],
      summary: 'Create Trigger',
      description: 'Create a new trigger for a session.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        name: Type.String(),
        prompt: Type.String(),
        session: Type.String(),
        schedule: Type.Optional(Type.Any()), // Optional - tasks without schedules run manually only
      }),
      response: {
        200: Type.Object({
          trigger: Type.Any(),
        }),
        400: Type.Object({
          error: Type.String(),
        }),
        401: Type.Object({
          error: Type.String(),
        }),
        404: Type.Object({
          error: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createTrigger(server, request, reply),
  })

  server.patch('/v2/triggers/:triggerId', {
    schema: {
      tags: ['Triggers'],
      summary: 'Update Trigger',
      description: 'Update an existing trigger.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        triggerId: Type.String(),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        prompt: Type.Optional(Type.String()),
        schedule: Type.Optional(Type.Any()),
        status: Type.Optional(
          Type.Union([
            Type.Literal('active'),
            Type.Literal('paused'),
            Type.Literal('finished'),
          ]),
        ),
      }),
      response: {
        200: Type.Any(),
        401: Type.Object({
          error: Type.String(),
        }),
        404: Type.Object({
          error: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateTrigger(server, request, reply),
  })

  server.delete('/v2/triggers/:triggerId', {
    schema: {
      tags: ['Triggers'],
      summary: 'Delete Trigger',
      description: 'Delete a trigger.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        triggerId: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
        }),
        401: Type.Object({
          error: Type.String(),
        }),
        404: Type.Object({
          error: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteTrigger(server, request, reply),
  })

  server.get('/v2/agents/:agentId/deployments', {
    schema: {
      tags: ['Agents - Deployments'],
      summary: 'Get Agent Deployments',
      description:
        'Retrieve all platform deployments (Discord, Twitter, etc.) for a specific agent.',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAgentDeployments(request, reply),
  })

  server.post('/v2/agents/:agentId/deployments', {
    schema: {
      tags: ['Agents - Deployments'],
      summary: 'Deploy Agent',
      description:
        'Deploy an agent to a platform or update an existing deployment configuration.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      response: {
        200: Type.Object({
          deploymentId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deployAgent(server, request, reply),
  })

  server.patch('/v2/agents/:agentId/deployments', {
    schema: {
      tags: ['Agents - Deployments'],
      summary: 'Update Agent Deployment',
      description:
        'Modify the configuration or settings of an existing agent deployment.',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateAgentDeployment(server, request, reply),
  })

  server.delete('/v2/agents/:agentId/deployments/:platform', {
    schema: {
      tags: ['Agents - Deployments'],
      summary: 'Delete Agent Deployment',
      description:
        'Remove an agent deployment from a specific platform, stopping its operation there.',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteAgentDeployment(server, request, reply),
  })

  // Discord channel management routes
  server.get('/v2/agents/:agentId/deployments/discord/channels', {
    schema: {
      tags: ['Agents - Deployments'],
      summary: 'Get Discord Channels',
      description:
        'Retrieve available Discord guilds and channels for an agent with a Discord deployment.',
      security: [{ apiKey: [] }],
      params: Type.Object({
        agentId: Type.String(),
      }),
      response: {
        200: Type.Object({
          guilds: Type.Array(
            Type.Object({
              id: Type.String(),
              name: Type.String(),
              icon: Type.Optional(Type.Union([Type.String(), Type.Null()])),
              member_count: Type.Optional(
                Type.Union([Type.Number(), Type.Null()]),
              ),
              channels: Type.Array(
                Type.Object({
                  id: Type.String(),
                  name: Type.String(),
                  type: Type.Number(),
                  type_name: Type.String(),
                  category_id: Type.Optional(
                    Type.Union([Type.String(), Type.Null()]),
                  ),
                  category_name: Type.Optional(
                    Type.Union([Type.String(), Type.Null()]),
                  ),
                  position: Type.Optional(Type.Number()),
                }),
              ),
            }),
          ),
          last_refreshed_at: Type.Optional(
            Type.Union([Type.String(), Type.Null()]),
          ),
        }),
        401: Type.Object({ error: Type.String() }),
        404: Type.Object({ error: Type.String() }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getDiscordChannels(server, request, reply),
  })

  server.post('/v2/agents/:agentId/deployments/discord/refresh', {
    schema: {
      tags: ['Agents - Deployments'],
      summary: 'Refresh Discord Channels',
      description:
        'Refresh the list of available Discord guilds and channels from the Discord API.',
      security: [{ apiKey: [] }],
      params: Type.Object({
        agentId: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          guilds_count: Type.Number(),
          channels_count: Type.Number(),
          guilds: Type.Array(
            Type.Object({
              id: Type.String(),
              name: Type.String(),
              channel_count: Type.Number(),
            }),
          ),
        }),
        401: Type.Object({ error: Type.String() }),
        404: Type.Object({ error: Type.String() }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => refreshDiscordChannels(server, request, reply),
  })

  server.delete('/v2/agents/:agentId', {
    schema: {
      tags: ['Agents'],
      summary: 'Delete Agent',
      description:
        'Permanently delete an agent and all its associated data, deployments, and configurations.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteAgent(request, reply),
  })

  server.post('/v2/agents/:agentId/like', {
    schema: {
      tags: ['Agents'],
      summary: 'Like Agent',
      description:
        'Add a like to an agent, showing appreciation and potentially boosting its visibility.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      response: {
        200: {
          message: Type.String(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => likeAgent(server, request, reply),
  })

  server.delete('/v2/agents/:agentId/like', {
    schema: {
      tags: ['Agents'],
      summary: 'Unlike Agent',
      description: 'Remove a previously given like from an agent.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      response: {
        200: {
          message: Type.String(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => unlikeAgent(server, request, reply),
  })

  server.get('/v2/triggers', {
    schema: {
      tags: ['Triggers'],
      summary: 'Get User Triggers',
      description: 'Retrieve all triggers owned by the authenticated user.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: {
          triggers: Type.Array(Type.Any()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAllUserTriggers(server, request, reply),
  })

  server.get('/v2/agents/deployments', {
    schema: {
      tags: ['Agents - Deployments'],
      summary: 'Get User Deployments',
      description:
        'Retrieve all deployments across all agents owned by the authenticated user.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: {
          deployments: Type.Array(Type.Any()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAllUserDeployments(server, request, reply),
  })

  server.get('/v2/agents/:agentId/memory', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Get Agent Memory',
      description:
        'Retrieve the personalized memory content and unabsorbed directives for a specific agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      response: {
        200: {
          content: Type.String(),
          unabsorbedDirectives: Type.Array(
            Type.Object({
              _id: Type.String(),
              content: Type.String(),
              createdAt: Type.Optional(Type.String()),
            }),
          ),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAgentMemory(server, request, reply),
  })

  server.post('/v2/agents/:agentId/memory', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Save Agent Memory',
      description:
        'Store or update personalized memory content for an agent to improve future interactions.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      body: Type.Object({ content: Type.String() }),
      response: { 200: { success: Type.Boolean() } },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => saveAgentMemory(server, request, reply),
  })

  server.get('/v2/agents/:agentId/memory-context', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Get Agent Memory Context',
      description:
        'Retrieve fully formed memory context including user memory and collective memory shards for an agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      response: {
        200: {
          userMemory: Type.String(),
          collectiveMemory: Type.Array(
            Type.Object({
              shard_name: Type.String(),
              content: Type.String(),
            }),
          ),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAgentMemoryContext(server, request, reply),
  })

  // New routes for memory operations
  server.get('/v2/agents/:agentId/memory-user', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Get Memory User',
      description:
        'Retrieve the complete memory_user document containing all user-specific data for an agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => retrieveMemoryUser(server, request, reply),
  })

  server.patch('/v2/agents/:agentId/memory-user', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Update Memory User',
      description:
        'Modify the memory_user document with updated user-specific information for an agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      body: Type.Record(Type.String(), Type.Any()),
      response: { 200: { success: Type.Boolean() } },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateMemoryUser(server, request, reply),
  })

  server.patch('/v2/agents/:agentId/user-memory-enabled', {
    schema: {
      tags: ['Agents'],
      summary: 'Toggle Memory Setting',
      description: 'Enable or disable the user memory feature for an agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      body: Type.Object({
        user_memory_enabled: Type.Boolean(),
      }),
      response: { 200: { success: Type.Boolean() } },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (
      request: FastifyRequest<{
        Params: { agentId: string }
        Body: { user_memory_enabled: boolean }
      }>,
      reply,
    ) => updateUserMemoryEnabled(server, request, reply),
  })

  server.get('/v2/memory-sessions/:memoryId', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Get Memory Session',
      description:
        'Retrieve a specific memory_session document containing session-specific memory data.',
      security: [{ apiKey: [] }],
      params: { memoryId: Type.String() },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => retrieveMemorySession(server, request, reply),
  })

  server.patch('/v2/memory-sessions/:memoryId', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Update Memory Session',
      description:
        'Modify a memory_session document with updated session-specific information.',
      security: [{ apiKey: [] }],
      params: { memoryId: Type.String() },
      body: Type.Record(Type.String(), Type.Any()),
      response: { 200: { success: Type.Boolean() } },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateMemorySession(server, request, reply),
  })

  server.delete('/v2/agents/:agentId/memory/:memoryId', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Remove Unabsorbed Memory',
      description:
        'Delete specific unabsorbed memory items from the user memory for an agent.',
      security: [{ apiKey: [] }],
      params: {
        agentId: Type.String(),
        memoryId: Type.String(),
      },
      response: { 200: { success: Type.Boolean() } },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => removeUnabsorbedMemory(server, request, reply),
  })

  // Collective Memory routes
  server.get('/v2/agents/:agentId/memory-agent', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Get Collective Memory',
      description:
        'Retrieve all collective memory shards and their facts for an agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      response: {
        200: {
          shards: Type.Array(
            Type.Object({
              _id: Type.String(),
              agent_id: Type.Any(),
              content: Type.Optional(Type.String()),
              extraction_prompt: Type.Optional(Type.String()),
              is_active: Type.Optional(Type.Boolean()),
              facts: Type.Array(
                Type.Object({
                  _id: Type.String(),
                  content: Type.String(),
                  createdAt: Type.Optional(Type.String()),
                  updatedAt: Type.Optional(Type.String()),
                }),
              ),
              unabsorbed_memory_ids: Type.Array(
                Type.Object({
                  _id: Type.String(),
                  content: Type.String(),
                  createdAt: Type.Optional(Type.String()),
                  updatedAt: Type.Optional(Type.String()),
                }),
              ),
            }),
          ),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => retrieveMemoryAgent(server, request, reply),
  })

  server.post('/v2/agents/:agentId/memory-agent', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Create Memory Shard',
      description:
        'Create a new collective memory shard with a specific extraction prompt for organizing agent knowledge.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      body: Type.Object({
        shard_name: Type.String({ minLength: 1, maxLength: 50 }),
        extraction_prompt: Type.String({
          minLength: MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS,
          maxLength: MEMORY_LIMITS.EXTRACTION_PROMPT_MAX_CHARS,
        }),
      }),
      response: {
        200: {
          success: Type.Boolean(),
          shard_id: Type.String(),
          message: Type.String(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createMemoryAgent(server, request, reply),
  })

  server.patch('/v2/agents/:agentId/memory-agent/:memoryAgentId', {
    schema: {
      tags: ['Agents - Memory'],
      summary: 'Update Memory Agent',
      description:
        'Modify a memory_agent document containing collective memory data.',
      security: [{ apiKey: [] }],
      params: {
        agentId: Type.String(),
        memoryAgentId: Type.String(),
      },
      body: Type.Record(Type.String(), Type.Any()),
      response: { 200: { success: Type.Boolean() } },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateMemoryAgent(server, request, reply),
  })

  server.delete(
    '/v2/agents/:agentId/memory-agent/:memoryAgentId/memory/:memoryId',
    {
      schema: {
        tags: ['Agents - Memory'],
        summary: 'Remove Agent Memory',
        description:
          'Remove specific memory items from agent collective memory arrays (facts or unabsorbed memory).',
        security: [{ apiKey: [] }],
        params: {
          agentId: Type.String(),
          memoryAgentId: Type.String(),
          memoryId: Type.String(),
        },
        body: Type.Object({
          arrayField: Type.Union([
            Type.Literal('facts'),
            Type.Literal('unabsorbed_memory_ids'),
          ]),
        }),
        response: { 200: { success: Type.Boolean() } },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
      handler: (request, reply) =>
        removeMemoryFromAgent(server, request, reply),
    },
  )

  // Dashboard route
  server.get('/v2/agents/:agentId/dashboard', {
    schema: {
      tags: ['Agents'],
      summary: 'Get Agent Dashboard',
      description:
        'Retrieve analytics and activity data for an agent within a specified date range.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      querystring: {
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
      },
      response: {
        200: {
          sessionActivity: Type.Array(
            Type.Object({
              date: Type.String(),
              platform: Type.String(),
              totalUserMessages: Type.Number(),
              sessionCount: Type.Number(),
            }),
          ),
          messageActivity: Type.Optional(
            Type.Array(
              Type.Object({
                date: Type.String(),
                platform: Type.String(),
                messageCount: Type.Number(),
                tokenCount: Type.Optional(Type.Number()),
              }),
            ),
          ),
          userStats: Type.Optional(
            Type.Array(
              Type.Object({
                username: Type.String(),
                messageCount: Type.Number(),
                tokenCount: Type.Optional(Type.Number()),
              }),
            ),
          ),
          dateRange: Type.Object({
            start: Type.String(),
            end: Type.String(),
          }),
          platforms: Type.Array(Type.String()),
          roles: Type.Optional(Type.Array(Type.String())),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getDashboardData(server, request, reply),
  })

  // Agent creations
  server.get('/v2/agents/:agentId/creations', {
    schema: {
      tags: ['Agents'],
      summary: 'Get Agent Creations',
      description:
        "Retrieve a list of the agent's creations, including both the user's own creations and public creations by others.",
      security: [
        {
          apiKey: [],
        },
      ],
      params: { agentId: Type.String() },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          cursor: { type: 'string' },
        },
      },
      response: {
        200: Type.Object({
          docs: Type.Array(Type.Any()),
          nextCursor: Type.Optional(Type.String()),
          totalDocs: Type.Number(),
        }),
        400: Type.Object({ message: Type.String() }),
        401: Type.Object({ message: Type.String() }),
        403: Type.Object({ message: Type.String() }),
        404: Type.Object({ message: Type.String() }),
        500: Type.Object({ message: Type.String() }),
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getAgentCreations(server, request, reply),
  })

  // Permissions routes
  server.get('/v2/agents/:agentId/permissions', {
    schema: {
      tags: ['Agents'],
      summary: 'Get Agent Permissions',
      description:
        'Retrieve the list of users who have access permissions to an agent and their permission levels.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      response: {
        200: {
          permissions: Type.Array(
            Type.Object({
              _id: Type.String(),
              agent: Type.String(),
              user: Type.Object({
                _id: Type.String(),
                userId: Type.Optional(Type.String()),
                username: Type.String(),
                userImage: Type.Optional(Type.String()),
              }),
              level: Type.String(),
              grantedAt: Type.String(),
            }),
          ),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAgentPermissions(request, reply),
  })

  server.put('/v2/agents/:agentId/permissions', {
    schema: {
      tags: ['Agents'],
      summary: 'Update Agent Permissions',
      description:
        'Grant or modify access permissions for users to collaborate on an agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      body: Type.Object({
        permissions: Type.Array(
          Type.Object({
            username: Type.String(),
            level: Type.Union([Type.Literal('editor'), Type.Literal('owner')]),
          }),
        ),
      }),
      response: {
        200: { success: Type.Boolean() },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateAgentPermissions(server, request, reply),
  })

  server.get('/v2/agents/shared', {
    schema: {
      tags: ['Agents'],
      summary: 'Get Shared Agents',
      description:
        'Retrieve all agents that have been shared with the current user by other users.',
      security: [{ apiKey: [] }],
      response: {
        200: {
          sharedAgents: Type.Array(
            Type.Object({
              agent: Type.Any(),
              permissionLevel: Type.String(),
              grantedAt: Type.String(),
            }),
          ),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getSharedAgents(server, request, reply),
  })

  // Agent Realtime Settings routes
  server.get('/v2/agents/:agentId/realtime', {
    schema: {
      tags: ['Agents - Realtime'],
      summary: 'Get Agent Realtime Settings',
      description:
        'Retrieve the ElevenLabs realtime voice conversation settings for an agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      response: {
        200: {
          settings: Type.Object({
            agent: Type.String(),
            elevenlabs_agent_id: Type.Optional(
              Type.Union([Type.String(), Type.Null()]),
            ),
            voice_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
            language: Type.Optional(Type.String()),
            first_message: Type.Optional(
              Type.Union([Type.String(), Type.Null()]),
            ),
            llm_model: Type.Optional(Type.String()),
            temperature: Type.Optional(Type.Number()),
            max_tokens: Type.Optional(Type.Number()),
            tts_stability: Type.Optional(Type.Number()),
            tts_speed: Type.Optional(Type.Number()),
            tts_similarity_boost: Type.Optional(Type.Number()),
            user_input_fields: Type.Optional(Type.Array(Type.String())),
          }),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      getAgentRealtimeSettings(server, request, reply),
  })

  server.patch('/v2/agents/:agentId/realtime', {
    schema: {
      tags: ['Agents - Realtime'],
      summary: 'Update Agent Realtime Settings',
      description:
        'Update the ElevenLabs realtime voice conversation settings for an agent.',
      security: [{ apiKey: [] }],
      params: { agentId: Type.String() },
      body: Type.Object({
        elevenlabs_agent_id: Type.Optional(Type.String()),
        voice_id: Type.Optional(Type.String()),
        language: Type.Optional(Type.String()),
        first_message: Type.Optional(Type.String()),
        llm_model: Type.Optional(
          Type.Union([
            Type.Literal('gpt-5'),
            Type.Literal('gpt-5-mini'),
            Type.Literal('gpt-5-nano'),
            Type.Literal('gemini-2.5-flash-lite'),
            Type.Literal('gemini-2.5-flash'),
            Type.Literal('claude-sonnet-4-5'),
            Type.Literal('claude-haiku-4-5'),
          ]),
        ),
        temperature: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
        max_tokens: Type.Optional(Type.Number({ minimum: 1, maximum: 16384 })),
        tts_stability: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
        tts_speed: Type.Optional(Type.Number({ minimum: 0, maximum: 1.2 })),
        tts_similarity_boost: Type.Optional(
          Type.Number({ minimum: 0, maximum: 1 }),
        ),
        user_input_fields: Type.Optional(Type.Array(Type.String())),
      }),
      response: {
        200: {
          settings: Type.Any(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      updateAgentRealtimeSettings(server, request, reply),
  })
}

export default agentRoutes
