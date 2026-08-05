import { executeRealtimeTool } from '../../controllers/v2/realtimeToolControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

// DISABLED: this route executes tools via eve's `handle_realtime_tool`, which
// calls `tool.async_run()` — the code path that does NOT bill. All charging
// lives in `handle_start_task` (calculate_cost -> check_manna -> spend_manna),
// so every call here ran real GPU generation for free, with no task record and
// no transaction, for any authenticated user. `create` alone reaches veo3 /
// kling / seedance at ~100-500 manna a call. It also skipped the
// toolAccessCheck and taskRateLimitCheck that /v2/tasks/create applies.
//
// Flip back to true only once realtime tool calls are routed through
// `async_start_task` (or bill explicitly) — see the audit notes.
const REALTIME_TOOLS_ENABLED = false

const realtimeToolRoutesV2: FastifyPluginAsync = async server => {
  server.post('/v2/realtime/tool', {
    schema: {
      tags: ['Realtime'],
      summary: 'Execute Realtime Tool',
      description:
        'Execute a tool during a realtime voice conversation. Some tools wait for response (blocking), others return immediately (async).',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        tool_name: Type.String({
          description: 'Tool name: create, display, or create_async',
        }),
        args: Type.Record(Type.String(), Type.Any(), {
          description: 'Tool arguments',
        }),
        session_id: Type.String({
          description: 'Eden session ID for this conversation',
        }),
      }),
      response: {
        200: Type.Object({
          task_id: Type.String(),
          status: Type.String(),
          result: Type.Optional(Type.Any()),
          message: Type.Optional(Type.String()),
          error: Type.Optional(Type.String()),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        401: Type.Object({
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
    handler: (request, reply) => {
      if (!REALTIME_TOOLS_ENABLED) {
        request.log.warn(
          { userId: request.user?.userId },
          'blocked call to disabled unbilled realtime tool endpoint',
        )
        return reply
          .status(403)
          .send({ message: 'Realtime tool execution is disabled' })
      }
      return executeRealtimeTool(server, request, reply)
    },
  })
}

export default realtimeToolRoutesV2
