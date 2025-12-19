import {
  closeRealtimeSession,
  getRealtimeSession,
  processHeartbeat,
  startRealtimeSession,
} from '../controllers/realtimeSessionBillingController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

/**
 * Routes for realtime session billing
 * These endpoints handle billing for voice/realtime conversations
 */
export const realtimeSessionBillingRoutes = async (server: FastifyInstance) => {
  // Start a new realtime session (bills initial minute)
  server.post(
    '/v2/realtime-sessions/start',
    {
      schema: {
        tags: ['Realtime Sessions'],
        summary: 'Start a billable realtime session',
        description:
          'Starts a new realtime voice session. Requires minimum manna balance. Bills first minute immediately.',
        security: [{ apiKey: [] }],
        body: Type.Object({
          agentId: Type.String({
            description: 'ID of the agent for this realtime session',
          }),
          sessionId: Type.Optional(
            Type.String({
              description: 'Optional existing chat session ID to link to',
            }),
          ),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            realtimeSession: Type.Any(),
            billingConfig: Type.Object({
              costPerMinute: Type.Number(),
              billingIntervalSeconds: Type.Number(),
            }),
          }),
          402: Type.Object({
            message: Type.String(),
            currentBalance: Type.Optional(Type.Number()),
            minimumRequired: Type.Optional(Type.Number()),
          }),
        },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
    },
    (request, reply) => startRealtimeSession(server, request, reply),
  )

  // Close a realtime session
  server.post(
    '/v2/realtime-sessions/:realtimeSessionId/close',
    {
      schema: {
        tags: ['Realtime Sessions'],
        summary: 'Close a realtime session',
        description: 'Closes an active realtime session and stops billing.',
        security: [{ apiKey: [] }],
        params: Type.Object({
          realtimeSessionId: Type.String(),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            realtimeSession: Type.Any(),
            totalMannaBilled: Type.Number(),
          }),
        },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
    },
    (request, reply) => closeRealtimeSession(server, request, reply),
  )

  // Heartbeat - keeps session alive and triggers billing ticks
  server.post(
    '/v2/realtime-sessions/:realtimeSessionId/heartbeat',
    {
      schema: {
        tags: ['Realtime Sessions'],
        summary: 'Send heartbeat for realtime session',
        description:
          'Updates session activity timestamp. May trigger a billing tick if enough time has passed.',
        security: [{ apiKey: [] }],
        params: Type.Object({
          realtimeSessionId: Type.String(),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            realtimeSession: Type.Any(),
            billedThisTick: Type.Boolean(),
            totalMinutesBilled: Type.Number(),
          }),
          402: Type.Object({
            message: Type.String(),
            realtimeSession: Type.Any(),
          }),
        },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
    },
    (request, reply) => processHeartbeat(server, request, reply),
  )

  // Get realtime session details
  server.get(
    '/v2/realtime-sessions/:realtimeSessionId',
    {
      schema: {
        tags: ['Realtime Sessions'],
        summary: 'Get realtime session details',
        security: [{ apiKey: [] }],
        params: Type.Object({
          realtimeSessionId: Type.String(),
        }),
        response: {
          200: Type.Object({
            realtimeSession: Type.Any(),
          }),
        },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
    },
    (request, reply) => getRealtimeSession(server, request, reply),
  )
}
