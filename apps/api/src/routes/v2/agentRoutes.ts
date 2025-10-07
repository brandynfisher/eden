import { paginatedResponse, paginationProperties } from '..'
import {
  createAgent,
  createAgentTrigger,
  createMemoryAgent,
  deleteAgent,
  deleteAgentDeployment,
  deleteAgentTrigger,
  deployAgent,
  executeAgentTrigger,
  getAgent,
  getAgentCreations,
  getAgentDeployments,
  getAgentMemory,
  getAgentPermissions,
  getAgentTriggers,
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
  updateAgentTrigger,
  updateMemoryAgent,
  updateMemorySession,
  updateMemoryUser,
  updateUserMemoryEnabled,
} from '../../controllers/agentController'
import { getAgentTrigger } from '../../controllers/agentServicesController'
import { MEMORY_LIMITS } from '../../lib/constants'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifyRequest } from 'fastify'

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

  server.get('/v2/agents/:agentId/triggers', {
    schema: {
      tags: ['Agents - Triggers'],
      summary: 'Get Agent Triggers',
      description:
        'Retrieve all automated triggers configured for a specific agent.',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAgentTriggers(request, reply),
  })

  server.post('/v2/agents/:agentId/triggers', {
    schema: {
      tags: ['Agents - Triggers'],
      summary: 'Create Agent Trigger',
      description:
        'Create a new automated trigger that activates the agent under specific conditions.',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createAgentTrigger(server, request, reply),
  })

  server.get('/v2/agents/:agentId/triggers/:triggerId', {
    schema: {
      tags: ['Agents - Triggers'],
      summary: 'Get Single Trigger',
      description: 'Retrieve a specific trigger by its ID.',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAgentTrigger(request, reply),
  })

  server.patch('/v2/agents/:agentId/triggers/:triggerId', {
    schema: {
      tags: ['Agents - Triggers'],
      summary: 'Update Agent Trigger',
      description:
        'Modify the configuration or conditions of an existing agent trigger.',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateAgentTrigger(request, reply),
  })

  server.delete('/v2/agents/:agentId/triggers/:triggerId', {
    schema: {
      tags: ['Agents - Triggers'],
      summary: 'Delete Agent Trigger',
      description:
        'Remove an automated trigger from an agent, stopping its activation.',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteAgentTrigger(server, request, reply),
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
    handler: (request, reply) => executeAgentTrigger(server, request, reply),
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

  server.get('/v2/agents/triggers', {
    schema: {
      tags: ['Agents - Triggers'],
      summary: 'Get User Triggers',
      description:
        'Retrieve all triggers across all agents owned by the authenticated user.',
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
    handler: (request, reply) => updateAgentPermissions(request, reply),
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
}

export default agentRoutes
