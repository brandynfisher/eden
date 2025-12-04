import {
  DiscordOAuthQuery,
  createFarcasterManagedSigner,
  createWebviewSignInToken,
  disconnectTikTok,
  disconnectTwitter,
  disconnectTwitterIntegration,
  discordOAuth,
  getFarcasterSignerStatus,
  tiktokOAuth,
  twitterIntegrationOAuth,
  twitterOAuth,
} from '../../controllers/auth/v2/authControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const authRoutes: FastifyPluginAsync = async server => {
  server.get<{
    Querystring: DiscordOAuthQuery
  }>('/v2/auth/discord/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Discord OAuth Callback',
      description:
        'Handle Discord OAuth authentication callback and process authorization code.',
      hide: true,
      querystring: Type.Object({
        code: Type.String(),
        state: Type.String(),
        mode: Type.Optional(Type.String()),
      }),
    },
    handler: (request, reply) => discordOAuth(server, request, reply),
  })

  server.get('/v2/auth/twitter/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Twitter OAuth Callback',
      description:
        'Handle Twitter OAuth authentication callback and process authorization code.',
      hide: true,
      querystring: Type.Object({
        code: Type.String(),
        state: Type.String(),
      }),
    },
    handler: (request, reply) => twitterOAuth(server, request, reply),
  })

  server.delete('/v2/auth/twitter/disconnect', {
    schema: {
      tags: ['Auth'],
      summary: 'Disconnect Twitter',
      description:
        'Remove Twitter authentication and disconnect the user account from Twitter integration.',
      hide: true,
    },
    handler: (request, reply) => disconnectTwitter(request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.get('/v2/auth/tiktok/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'TikTok OAuth Callback',
      description:
        'Handle TikTok OAuth authentication callback and process authorization code or errors.',
      hide: true,
      querystring: Type.Object({
        code: Type.Optional(Type.String()),
        state: Type.String(),
        error: Type.Optional(Type.String()),
        error_description: Type.Optional(Type.String()),
      }),
    },
    handler: (request, reply) => tiktokOAuth(server, request, reply),
  })

  server.delete('/v2/auth/tiktok/disconnect', {
    schema: {
      tags: ['Auth'],
      summary: 'Disconnect TikTok',
      description:
        'Remove TikTok authentication and disconnect the agent from TikTok integration.',
      hide: true,
      querystring: Type.Object({
        agentId: Type.String(),
      }),
    },
    handler: (request, reply) => disconnectTikTok(request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.get('/v2/auth/integrations/twitter/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Twitter Integration Callback',
      description:
        'Handle Twitter OAuth callback for agent integration and process authorization for agent deployment.',
      hide: true,
      querystring: Type.Object({
        code: Type.Optional(Type.String()),
        state: Type.String(),
        error: Type.Optional(Type.String()),
        error_description: Type.Optional(Type.String()),
      }),
    },
    handler: (request, reply) =>
      twitterIntegrationOAuth(server, request, reply),
  })

  server.delete('/v2/auth/integrations/twitter/disconnect', {
    schema: {
      tags: ['Auth'],
      summary: 'Disconnect Twitter Integration',
      description:
        'Remove Twitter integration from an agent and disconnect it from Twitter deployment.',
      hide: true,
      querystring: Type.Object({
        agentId: Type.String(),
      }),
    },
    handler: (request, reply) => disconnectTwitterIntegration(request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.post('/v2/auth/farcaster/managed-signer', {
    schema: {
      tags: ['Auth'],
      summary: 'Create Farcaster Managed Signer',
      description:
        'Create a Neynar managed signer for Farcaster integration. Returns signer UUID and approval URL.',
      hide: true,
      body: Type.Object({
        agentId: Type.String(),
      }),
    },
    handler: (request, reply) =>
      createFarcasterManagedSigner(server, request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.get('/v2/auth/farcaster/managed-signer/status', {
    schema: {
      tags: ['Auth'],
      summary: 'Get Farcaster Managed Signer Status',
      description:
        'Check the approval status of a Farcaster managed signer by UUID.',
      hide: true,
      querystring: Type.Object({
        signerUuid: Type.String(),
      }),
    },
    handler: (request, reply) =>
      getFarcasterSignerStatus(server, request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.post('/v2/auth/native/webview-token', {
    schema: {
      tags: ['Auth'],
      summary: 'Create sign-in token for WebView handoff',
      description:
        'Returns a short-lived Clerk sign-in token so the native app can open the webview already authenticated.',
      hide: true,
      body: Type.Object({
        returnUrl: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          token: Type.String(),
          expiresInSeconds: Type.Number(),
        }),
      },
    },
    handler: (request, reply) =>
      createWebviewSignInToken(server, request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })
}

export default authRoutes
