import { executeRealtimeTool } from '../../controllers/v2/realtimeToolControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

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
    handler: (request, reply) => executeRealtimeTool(server, request, reply),
  })
}

export default realtimeToolRoutesV2
