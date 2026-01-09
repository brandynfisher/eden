import {
  DiscordOAuthQuery,
  createFarcasterManagedSigner,
  createWebviewSignInToken,
  disconnectGoogleCalendar,
  disconnectInstagram,
  disconnectTikTok,
  disconnectTwitter,
  disconnectTwitterIntegration,
  discordOAuth,
  discordV3OAuthCallback,
  getDiscordAvailableGuilds,
  getDiscordGuildAccess,
  getDiscordGuildChannels,
  getDiscordGuildRoles,
  getFarcasterSignerStatus,
  googleCalendarOAuthCallback,
  googleCalendarOAuthInit,
  instagramOAuth,
  tiktokOAuth,
  twitterIntegrationOAuth,
  twitterOAuth,
  updateDiscordGuildAccess,
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

  server.get('/v2/deployments/discord/oauth/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Discord V3 OAuth Callback',
      description:
        'Handle Discord OAuth callback for V3 deployments and return available guilds.',
      hide: true,
      querystring: Type.Object({
        code: Type.Optional(Type.String()),
        state: Type.Optional(Type.String()),
        error: Type.Optional(Type.String()),
      }),
    },
    handler: (request, reply) => discordV3OAuthCallback(server, request, reply),
  })

  server.get('/v2/deployments/discord/guilds', {
    schema: {
      tags: ['Auth'],
      summary: 'Get Discord Guilds',
      description:
        'Fetch Discord guilds available for the current user without re-authentication.',
      hide: true,
    },
    handler: (request, reply) =>
      getDiscordAvailableGuilds(server, request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.get('/v2/deployments/discord/guilds/:guildId/channels', {
    schema: {
      tags: ['Auth'],
      summary: 'Get Discord Guild Channels',
      description:
        'Fetch text channels for a Discord guild using the bot token.',
      hide: true,
      params: Type.Object({
        guildId: Type.String(),
      }),
    },
    handler: (request, reply) =>
      getDiscordGuildChannels(server, request, reply),
  })

  server.get('/v2/deployments/discord/guilds/:guildId/roles', {
    schema: {
      tags: ['Auth'],
      summary: 'Get Discord Guild Roles',
      description: 'Fetch roles for a Discord guild using the bot token.',
      hide: true,
      params: Type.Object({
        guildId: Type.String(),
      }),
    },
    handler: (request, reply) => getDiscordGuildRoles(server, request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.get('/v2/deployments/discord/guilds/:guildId/access', {
    schema: {
      tags: ['Auth'],
      summary: 'Get Discord Guild Access Roles',
      description: 'Fetch configured access roles for a Discord guild.',
      hide: true,
      params: Type.Object({
        guildId: Type.String(),
      }),
    },
    handler: (request, reply) => getDiscordGuildAccess(server, request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.post('/v2/deployments/discord/guilds/:guildId/access', {
    schema: {
      tags: ['Auth'],
      summary: 'Update Discord Guild Access Roles',
      description: 'Update configured access roles for a Discord guild.',
      hide: true,
      params: Type.Object({
        guildId: Type.String(),
      }),
      body: Type.Object({
        allowedRoleIds: Type.Array(Type.String()),
      }),
    },
    handler: (request, reply) =>
      updateDiscordGuildAccess(server, request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
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

  server.get('/v2/auth/instagram/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Instagram OAuth Callback',
      description:
        'Handle Instagram OAuth callback and process authorization code or errors.',
      hide: true,
      querystring: Type.Object({
        code: Type.Optional(Type.String()),
        state: Type.String(),
        error: Type.Optional(Type.String()),
        error_description: Type.Optional(Type.String()),
      }),
    },
    handler: (request, reply) => instagramOAuth(server, request, reply),
  })

  server.delete('/v2/auth/instagram/disconnect', {
    schema: {
      tags: ['Auth'],
      summary: 'Disconnect Instagram',
      description:
        'Remove Instagram authentication and disconnect the agent from Instagram integration.',
      hide: true,
      querystring: Type.Object({
        agentId: Type.String(),
      }),
    },
    handler: (request, reply) => disconnectInstagram(request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
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

  server.get('/v2/auth/google-calendar/init', {
    schema: {
      tags: ['Auth'],
      summary: 'Initialize Google Calendar OAuth',
      description:
        'Returns the Google OAuth URL to redirect the user to for calendar access.',
      hide: true,
      querystring: Type.Object({
        agentId: Type.String(),
      }),
    },
    handler: (request, reply) =>
      googleCalendarOAuthInit(server, request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })

  server.get('/v2/auth/google-calendar/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Google Calendar OAuth Callback',
      description:
        'Handle Google OAuth callback, exchange code for tokens, and create deployment.',
      hide: true,
      querystring: Type.Object({
        code: Type.Optional(Type.String()),
        state: Type.String(),
        error: Type.Optional(Type.String()),
      }),
    },
    handler: (request, reply) =>
      googleCalendarOAuthCallback(server, request, reply),
  })

  server.delete('/v2/auth/google-calendar/disconnect', {
    schema: {
      tags: ['Auth'],
      summary: 'Disconnect Google Calendar',
      description: 'Remove Google Calendar integration from an agent.',
      hide: true,
      querystring: Type.Object({
        agentId: Type.String(),
      }),
    },
    handler: (request, reply) => disconnectGoogleCalendar(request, reply),
    preHandler: [(request, reply) => isAuth(server, request, reply)],
  })
}

export default authRoutes
