import { Agent } from '../../../models/Agent'
import { Deployment } from '../../../models/Deployment'
import { DiscordGuildAccess } from '../../../models/DiscordGuildAccess'
import { Manna } from '../../../models/Manna'
import { Transaction } from '../../../models/Transaction'
import { User } from '../../../models/User'
import { UserIdentity } from '../../../models/UserIdentity'
import { CreationV2 } from '../../../models/v2/CreationV2'
import {
  linkUserIdentity,
  unlinkUserIdentity,
} from '../../../services/userIdentityService'
import { getAuth } from '@clerk/fastify'
import { ViemLocalEip712Signer } from '@farcaster/hub-nodejs'
import { NeynarAPIClient } from '@neynar/nodejs-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { mnemonicToAccount } from 'viem/accounts'

export type DiscordOAuthQuery = {
  code?: string
  state?: string
  mode?: string
}

export const createWebviewSignInToken = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId: clerkUserId } = getAuth(request)

  if (!clerkUserId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  if (!server.clerk) {
    server.log.error('Clerk client not registered')
    return reply.status(500).send({ message: 'Auth service unavailable' })
  }

  const expiresInSeconds = 120

  try {
    const token = await server.clerk.signInTokens.createSignInToken({
      userId: clerkUserId,
      expiresInSeconds,
    })

    return reply.send({
      token: token.token,
      expiresInSeconds,
    })
  } catch (error) {
    server.log.error({ error }, 'Failed to create webview sign-in token')
    return reply.status(500).send({ message: 'Failed to create token' })
  }
}

export const discordOAuth = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Querystring: DiscordOAuthQuery }>,
  reply: FastifyReply,
) => {
  const { code, state } = request.query

  let parsedState: { userId?: string; mode?: string } | undefined
  if (state) {
    try {
      parsedState = JSON.parse(state)
    } catch {
      parsedState = undefined
    }
  }

  const userIdFromState = parsedState?.userId ?? state
  const isPopupFlow =
    parsedState?.mode === 'popup' || request.query.mode === 'popup'

  const sendPopupResponse = (success: boolean, message?: string) => {
    const targetOrigin = server.config.EDEN2_FRONTEND_URL || '*'
    const payload = JSON.stringify({
      type: 'discord-link',
      success,
      message,
    })
    return reply.type('text/html').send(`<!DOCTYPE html>
<html>
  <head>
    <title>Discord Connection</title>
  </head>
  <body>
    <script>
      ;(function() {
        try {
          if (window.opener && ${JSON.stringify(targetOrigin)} !== '*') {
            window.opener.postMessage(${payload}, ${JSON.stringify(
      targetOrigin,
    )})
          } else if (window.opener) {
            window.opener.postMessage(${payload}, '*')
          }
        } catch (err) {
          console.error(err)
        }
        window.close()
      })()
    </script>
    <p>You can close this window.</p>
  </body>
</html>`)
  }

  if (!code || !userIdFromState) {
    if (isPopupFlow) {
      return sendPopupResponse(false, 'Missing code or state')
    }
    return reply.status(400).send({
      message: 'Missing code or state',
    })
  }

  const user = await User.findOne({
    userId: userIdFromState,
  })

  if (!user) {
    if (isPopupFlow) {
      return sendPopupResponse(false, 'User not found')
    }
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  try {
    const response = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: server.config.DISCORD_CLIENT_ID as string,
        client_secret: server.config.DISCORD_CLIENT_SECRET as string,
        code,
        redirect_uri: `${server.config.API_URL}/v2/auth/discord/callback`,
        grant_type: 'authorization_code',
        scope: 'identify',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const { access_token } = response.data

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        authorization: `Bearer ${access_token}`,
      },
    })

    const discordId = userResponse.data.id
    const discordUsername = userResponse.data.username
    if (!discordId) {
      return reply.status(400).send({
        message: 'Discord user not found',
      })
    }

    const existingIdentity = await UserIdentity.findOne({
      provider: 'discord',
      provider_user_id: discordId.toString(),
      status: 'linked',
    })

    const canonicalUserId = (user.eden_user_id ?? user._id).toString()

    if (
      existingIdentity &&
      existingIdentity.eden_user_id?.toString() !== canonicalUserId
    ) {
      return reply.status(400).send({
        message: 'This Discord account is already connected to another user',
      })
    }

    if (!user.eden_user_id) {
      user.eden_user_id = user._id
    }
    user.discordId = discordId
    user.discordUsername = discordUsername

    if (!user.discordLinkBonusClaimed) {
      const manna = await Manna.findOneAndUpdate(
        { user: user._id },
        { $inc: { balance: server.config.MANNA_BONUS_DISCORD_LINK } },
      )
      user.discordLinkBonusClaimed = true

      if (manna) {
        const transaction = new Transaction({
          manna: manna._id,
          amount: server.config.MANNA_BONUS_DISCORD_LINK,
          type: 'discord_link_bonus',
        })
        await transaction.save()
      }
    }

    await user.save()

    await linkUserIdentity({
      provider: 'discord',
      provider_user_id: discordId.toString(),
      target_user_id: user._id,
      actor_eden_user_id: user.eden_user_id,
      metadata: {
        username: discordUsername,
        discriminator: userResponse.data.discriminator,
      },
    })

    // Give delegated creations to the user
    await CreationV2.updateMany(
      {
        'attributes.discordId': discordId.toString(),
        $or: [
          { user: { $ne: user._id } },
          { eden_user_id: { $ne: user.eden_user_id } },
        ],
      },
      { $set: { user: user._id, eden_user_id: user.eden_user_id } },
    )

    if (isPopupFlow) {
      return sendPopupResponse(true)
    }

    return reply.redirect(
      `${server.config.EDEN2_FRONTEND_URL}/settings/connections`,
    )
  } catch (error) {
    console.error(error)
    if (isPopupFlow) {
      return sendPopupResponse(false, 'Failed to exchange code for token')
    }
    return reply
      .status(500)
      .send({ message: 'Failed to exchange code for token' })
  }
}

export const twitterOAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { code, state } = request.query as { code: string; state: string }

  if (!code || !state) {
    return reply.status(400).send({
      message: 'Missing code or state',
    })
  }

  const user = await User.findOne({
    userId: state,
  })

  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: server.config.TWITTER_CLIENT_ID as string,
        redirect_uri: `${server.config.API_URL}/v2/auth/twitter/callback`,
        code_verifier: 'challenge', // This matches what we sent in the auth request
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: server.config.TWITTER_CLIENT_ID as string,
          password: server.config.TWITTER_CLIENT_SECRET as string,
        },
      },
    )

    const { access_token } = tokenResponse.data

    // Get user's Twitter info
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const twitterHandle = userResponse.data.data.username
    const twitterId = userResponse.data.data.id

    if (!twitterHandle || !twitterId) {
      return reply.status(400).send({
        message: 'Twitter username or ID not found',
      })
    }

    const existingIdentity = await UserIdentity.findOne({
      provider: 'twitter',
      provider_user_id: twitterId.toString(),
      status: 'linked',
    })

    const canonicalUserId = (user.eden_user_id ?? user._id).toString()

    if (
      existingIdentity &&
      existingIdentity.eden_user_id?.toString() !== canonicalUserId
    ) {
      return reply.status(400).send({
        message: 'This Twitter account is already connected to another user',
      })
    }

    // Save Twitter handle to user
    if (!user.eden_user_id) {
      user.eden_user_id = user._id
    }
    user.twitterHandle = twitterHandle
    user.twitterId = twitterId

    if (!user.twitterLinkBonusClaimed) {
      const manna = await Manna.findOneAndUpdate(
        { user: user._id },
        { $inc: { balance: server.config.MANNA_BONUS_TWITTER_LINK } },
      )
      user.twitterLinkBonusClaimed = true
      if (manna) {
        const transaction = new Transaction({
          manna: manna._id,
          amount: server.config.MANNA_BONUS_TWITTER_LINK,
          type: 'twitter_link_bonus',
        })
        await transaction.save()
      }
    }

    await user.save()

    await linkUserIdentity({
      provider: 'twitter',
      provider_user_id: twitterId.toString(),
      target_user_id: user._id,
      actor_eden_user_id: user.eden_user_id,
      metadata: {
        username: twitterHandle,
      },
    })

    return reply.redirect(
      `${server.config.EDEN2_FRONTEND_URL}/settings/connections`,
    )
  } catch (error) {
    console.error(
      'Twitter OAuth error:',
      (error as any).response?.data || error,
    )
    return reply
      .status(500)
      .send({ message: 'Failed to connect Twitter account' })
  }
}

export const disconnectTwitter = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const user = await User.findById(request.user.userId)

    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    const twitterId = user.twitterId

    // Remove Twitter handle from user
    user.twitterHandle = undefined
    user.twitterId = undefined
    await user.save()

    if (twitterId) {
      try {
        await unlinkUserIdentity({
          provider: 'twitter',
          provider_user_id: twitterId.toString(),
          actor_eden_user_id: user.eden_user_id ?? user._id,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!message.includes('does not exist and cannot be unlinked')) {
          throw error
        }
      }
    }

    return reply.status(200).send({
      message: 'Twitter account disconnected successfully',
    })
  } catch (error) {
    console.error('Twitter disconnect error:', error)
    return reply
      .status(500)
      .send({ message: 'Failed to disconnect Twitter account' })
  }
}

export const tiktokOAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { code, state, error } = request.query as {
    code?: string
    state: string
    error?: string
  }

  const sendPopupResponse = (data: {
    success: boolean
    message?: string
    type?: string
    redirectUrl?: string
    payload?: Record<string, unknown>
  }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>TikTok Connection</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#0f172a; color:#e2e8f0; }
    .card { text-align:center; padding:24px; border:1px solid #1f2937; border-radius:12px; background:#111827; box-shadow:0 10px 40px rgba(0,0,0,0.35); }
    .spinner { margin:0 auto 12px; width:40px; height:40px; border-radius:50%; border:3px solid rgba(255,255,255,0.18); border-top-color:#06b6d4; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { color:#34d399; }
    .error { color:#f87171; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner" aria-hidden="true"></div>
    <div id="status">Finishing TikTok connection...</div>
  </div>
  <script>
    (function() {
      const data = ${JSON.stringify(data)};
      const message = data.message || (data.success ? 'TikTok connected!' : 'Unable to connect TikTok');
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = data.success ? 'success' : 'error';
      }

      const postData = { type: data.type || 'tiktok-link', ...data };

      if (window.opener) {
        try {
          window.opener.postMessage(postData, '*');
        } catch (e) {}
        setTimeout(() => window.close(), 1200);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    })();
  </script>
</body>
</html>`
    return reply.type('text/html').send(html)
  }

  // State contains the agentId
  const agentId = state

  // Check if user cancelled the OAuth flow
  if (error || !code) {
    // Get agent to redirect back to their settings
    const agent = await Agent.findById(agentId)
    if (agent) {
      const redirectUrl = `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`
      return sendPopupResponse({
        success: false,
        message: error || 'OAuth cancelled or failed',
        redirectUrl,
        type: 'tiktok-link',
      })
    }
    return sendPopupResponse({
      success: false,
      message: error || 'OAuth cancelled or failed',
      type: 'tiktok-link',
    })
  }

  if (!state) {
    return sendPopupResponse({
      success: false,
      message: 'Missing state parameter',
      type: 'tiktok-link',
    })
  }

  try {
    // Get agent to find the owner
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return sendPopupResponse({
        success: false,
        message: 'Agent not found',
        type: 'tiktok-link',
      })
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: server.config.TIKTOK_CLIENT_KEY as string,
        client_secret: server.config.TIKTOK_CLIENT_SECRET as string,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${server.config.API_URL}/v2/auth/tiktok/callback`,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const { access_token, refresh_token, expires_in, open_id } =
      tokenResponse.data

    // Validate that we have the required credentials
    if (!access_token || !open_id) {
      console.error(
        'Invalid credentials received from TikTok',
        tokenResponse.data,
      )
      console.error('Access token:', access_token)
      console.error('Open ID:', open_id)
      return sendPopupResponse({
        success: false,
        message: 'Invalid credentials received from TikTok',
        type: 'tiktok-link',
      })
    }

    // Get user info to get username / handle
    let username = ''
    try {
      const userInfoResponse = await axios.get(
        'https://open.tiktokapis.com/v2/user/info/',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          params: {
            fields: 'display_name,username,profile_deep_link,union_id',
          },
        },
      )

      if (userInfoResponse.data?.data?.user) {
        const userData = userInfoResponse.data.data.user
        // Prefer explicit username; fall back to unique_id/profile_deep_link/display_name
        username =
          userData.username ||
          userData.unique_id ||
          (typeof userData.profile_deep_link === 'string'
            ? userData.profile_deep_link.split('@').pop()?.split('?')[0] ||
              userData.profile_deep_link.split('/').filter(Boolean).pop()
            : '') ||
          userData.display_name ||
          ''
      }
    } catch (error) {
      // Username is optional, continue without it
    }

    // Deploy the TikTok integration using the deployAgent logic
    const tiktokSecrets = {
      access_token,
      refresh_token,
      open_id,
      expires_at: new Date(Date.now() + expires_in * 1000),
      username,
    }

    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/create`,
      data: {
        agent: agentId,
        user: agent.owner,
        platform: 'tiktok',
        secrets: { tiktok: tiktokSecrets },
        config: { tiktok: { username } },
      },
    }

    await axios.post(modalRequest.endpoint, modalRequest.data, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    })

    // Persist username into deployment config/secrets for UI display
    if (username) {
      await Deployment.updateOne(
        { agent: agentId, platform: 'tiktok' },
        {
          $set: {
            'config.tiktok.username': username,
            'secrets.tiktok.username': username,
          },
        },
      )
    }

    // Redirect back to agent settings
    const redirectUrl = `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`

    return sendPopupResponse({
      success: true,
      message: 'TikTok connected successfully',
      type: 'tiktok-link',
      redirectUrl,
      payload: {
        username,
        agentId,
      },
    })
  } catch (error) {
    console.error('TikTok OAuth error:', error)
    return sendPopupResponse({
      success: false,
      message: 'Failed to connect TikTok account',
      type: 'tiktok-link',
    })
  }
}

export const instagramOAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { code, state, error, error_description } = request.query as {
    code?: string
    state: string
    error?: string
    error_description?: string
  }

  const sendPopupResponse = (data: {
    success: boolean
    message?: string
    type?: string
    redirectUrl?: string
    payload?: Record<string, unknown>
  }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Instagram Connection</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#0f172a; color:#e2e8f0; }
    .card { text-align:center; padding:24px; border:1px solid #1f2937; border-radius:12px; background:#111827; box-shadow:0 10px 40px rgba(0,0,0,0.35); }
    .spinner { margin:0 auto 12px; width:40px; height:40px; border-radius:50%; border:3px solid rgba(255,255,255,0.18); border-top-color:#f472b6; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { color:#34d399; }
    .error { color:#f87171; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner" aria-hidden="true"></div>
    <div id="status">Finishing Instagram connection...</div>
  </div>
  <script>
    (function() {
      const data = ${JSON.stringify(data)};
      const message = data.message || (data.success ? 'Instagram connected!' : 'Unable to connect Instagram');
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = data.success ? 'success' : 'error';
      }

      const postData = { type: data.type || 'instagram-link', ...data };

      if (window.opener) {
        try {
          window.opener.postMessage(postData, '*');
        } catch (e) {
          console.error('postMessage failed', e);
        }
        setTimeout(() => window.close(), 1200);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    })();
  </script>
</body>
</html>`
    return reply.type('text/html').send(html)
  }

  const agentId = state

  if (error || !code) {
    const agent = await Agent.findById(agentId)
    const redirectUrl = agent
      ? `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`
      : undefined
    return sendPopupResponse({
      success: false,
      message: error_description || error || 'OAuth cancelled or failed',
      redirectUrl,
      type: 'instagram-link',
    })
  }

  if (!state) {
    return sendPopupResponse({
      success: false,
      message: 'Missing state parameter',
      type: 'instagram-link',
    })
  }

  if (
    !server.config.INSTAGRAM_CLIENT_ID ||
    !server.config.INSTAGRAM_CLIENT_SECRET
  ) {
    server.log.error('Missing Instagram OAuth env (INSTAGRAM_CLIENT_ID/SECRET)')
    return sendPopupResponse({
      success: false,
      message: 'Instagram OAuth is not configured',
      type: 'instagram-link',
    })
  }

  try {
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return sendPopupResponse({
        success: false,
        message: 'Agent not found',
        type: 'instagram-link',
      })
    }

    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      new URLSearchParams({
        client_id: server.config.INSTAGRAM_CLIENT_ID as string,
        client_secret: server.config.INSTAGRAM_CLIENT_SECRET as string,
        grant_type: 'authorization_code',
        redirect_uri: `${server.config.API_URL}/v2/auth/instagram/callback`,
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const { access_token, user_id, expires_in } = tokenResponse.data as {
      access_token?: string
      user_id?: string | number
      expires_in?: number
    }

    const normalizedAccessToken =
      typeof access_token === 'string' ? access_token.trim() : access_token

    if (!normalizedAccessToken) {
      const { access_token: _redacted, ...rest } = tokenResponse.data as Record<
        string,
        unknown
      >
      server.log.error({ data: rest }, 'Instagram token exchange failed')
      return sendPopupResponse({
        success: false,
        message: 'Invalid credentials received from Instagram',
        type: 'instagram-link',
      })
    }

    let igUserId = user_id ? String(user_id) : ''
    let username = ''

    try {
      const meResponse = await axios.get(
        'https://graph.instagram.com/v24.0/me',
        {
          params: {
            fields: 'user_id,username,id',
            access_token: normalizedAccessToken,
          },
        },
      )

      const data = meResponse.data as {
        user_id?: string | number
        id?: string | number
        username?: string
      }

      igUserId = String(data.user_id ?? data.id ?? igUserId)
      username = data.username ?? username
    } catch {
      // Username is optional; continue without it.
    }

    const expiresAt =
      typeof expires_in === 'number'
        ? new Date(Date.now() + expires_in * 1000)
        : undefined

    const instagramSecrets = {
      access_token: normalizedAccessToken,
      refresh_token: null,
      expires_at: expiresAt,
      username,
    }

    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/create`,
      data: {
        agent: agentId,
        user: agent.owner,
        platform: 'instagram',
        secrets: { instagram: instagramSecrets },
        config: { instagram: { username, ig_user_id: igUserId } },
      },
    }

    await axios.post(modalRequest.endpoint, modalRequest.data, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    })

    await Deployment.updateOne(
      { agent: agentId, platform: 'instagram' },
      {
        $set: {
          'config.instagram.username': username || undefined,
          'config.instagram.ig_user_id': igUserId || undefined,
          'secrets.instagram.username': username || undefined,
        },
      },
    )

    const redirectUrl = `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`

    return sendPopupResponse({
      success: true,
      message: 'Instagram connected successfully',
      type: 'instagram-link',
      redirectUrl,
      payload: {
        username,
        ig_user_id: igUserId,
        agentId,
      },
    })
  } catch (err) {
    console.error('Instagram OAuth error:', err)
    return sendPopupResponse({
      success: false,
      message: 'Failed to connect Instagram account',
      type: 'instagram-link',
    })
  }
}

export const disconnectInstagram = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { agentId } = request.query as { agentId: string }

    if (!agentId) {
      return reply.status(400).send({
        message: 'Missing agentId',
      })
    }

    // Verify the caller owns the agent. These disconnect handlers previously
    // deleted a Deployment keyed only on the agentId from the query string and
    // never read request.user, so any authenticated caller could unlink any
    // agent's social account. Same check used by createFarcasterManagedSigner
    // and googleCalendarOAuthInit in this file.
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found',
      })
    }

    if (agent.owner.toString() !== request.user.userId.toString()) {
      return reply.status(403).send({
        message: 'Not authorized to modify this agent',
      })
    }

    await Deployment.deleteOne({
      agent: agentId,
      platform: 'instagram',
    })

    return reply.status(200).send({
      message: 'Instagram account disconnected successfully',
    })
  } catch (error) {
    console.error('Instagram disconnect error:', error)
    return reply
      .status(500)
      .send({ message: 'Failed to disconnect Instagram account' })
  }
}

export const disconnectTikTok = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { agentId } = request.query as { agentId: string }

    if (!agentId) {
      return reply.status(400).send({
        message: 'Missing agentId',
      })
    }

    // Remove TikTok deployment
    // Verify the caller owns the agent. These disconnect handlers previously
    // deleted a Deployment keyed only on the agentId from the query string and
    // never read request.user, so any authenticated caller could unlink any
    // agent's social account. Same check used by createFarcasterManagedSigner
    // and googleCalendarOAuthInit in this file.
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found',
      })
    }

    if (agent.owner.toString() !== request.user.userId.toString()) {
      return reply.status(403).send({
        message: 'Not authorized to modify this agent',
      })
    }

    await Deployment.deleteOne({
      agent: agentId,
      platform: 'tiktok',
    })

    return reply.status(200).send({
      message: 'TikTok account disconnected successfully',
    })
  } catch (error) {
    console.error('TikTok disconnect error:', error)
    return reply
      .status(500)
      .send({ message: 'Failed to disconnect TikTok account' })
  }
}

export const twitterIntegrationOAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { code, state, error } = request.query as {
    code?: string
    state: string
    error?: string
  }

  const sendPopupResponse = (data: {
    success: boolean
    message?: string
    type?: string
    redirectUrl?: string
    payload?: Record<string, unknown>
  }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Twitter Connection</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#0b1220; color:#e5e7eb; }
    .card { text-align:center; padding:24px; border:1px solid #1f2937; border-radius:12px; background:#0f172a; box-shadow:0 10px 40px rgba(0,0,0,0.35); }
    .spinner { margin:0 auto 12px; width:40px; height:40px; border-radius:50%; border:3px solid rgba(255,255,255,0.18); border-top-color:#1d9bf0; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { color:#34d399; }
    .error { color:#f87171; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner" aria-hidden="true"></div>
    <div id="status">Finishing Twitter connection...</div>
  </div>
  <script>
    (function() {
      const data = ${JSON.stringify(data)};
      const message = data.message || (data.success ? 'Twitter connected!' : 'Unable to connect Twitter');
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = data.success ? 'success' : 'error';
      }

      const postData = { type: data.type || 'twitter-integration-link', ...data };

      if (window.opener) {
        try {
          window.opener.postMessage(postData, '*');
        } catch (e) {
          console.error('postMessage failed', e);
        }
        setTimeout(() => window.close(), 1200);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    })();
  </script>
</body>
</html>`
    return reply.type('text/html').send(html)
  }

  // State contains the agentId
  const agentId = state

  // Check if user cancelled the OAuth flow
  if (error || !code) {
    // Get agent to redirect back to their settings
    const agent = await Agent.findById(agentId)
    if (agent) {
      const redirectUrl = `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`
      return sendPopupResponse({
        success: false,
        message: error || 'OAuth cancelled or failed',
        redirectUrl,
        type: 'twitter-integration-link',
      })
    }
    return sendPopupResponse({
      success: false,
      message: error || 'OAuth cancelled or failed',
      type: 'twitter-integration-link',
    })
  }

  if (!state) {
    return sendPopupResponse({
      success: false,
      message: 'Missing state parameter',
      type: 'twitter-integration-link',
    })
  }

  try {
    // Get agent to find the owner
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return sendPopupResponse({
        success: false,
        message: 'Agent not found',
        type: 'twitter-integration-link',
      })
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: server.config.TWITTER_INTEGRATIONS_CLIENT_ID as string,
        redirect_uri: `${server.config.API_URL}/v2/auth/integrations/twitter/callback`,
        code_verifier: 'challenge', // This matches what we sent in the auth request
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: server.config.TWITTER_INTEGRATIONS_CLIENT_ID as string,
          password: server.config.TWITTER_INTEGRATIONS_CLIENT_SECRET as string,
        },
      },
    )

    const { access_token, refresh_token, expires_in } = tokenResponse.data

    // Get user's Twitter info
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const twitterHandle = userResponse.data.data.username
    const twitterId = userResponse.data.data.id

    if (!twitterHandle || !twitterId) {
      return sendPopupResponse({
        success: false,
        message: 'Twitter username or ID not found',
        type: 'twitter-integration-link',
      })
    }

    // Deploy the Twitter integration using the deployAgent logic
    const twitterSecrets = {
      access_token,
      refresh_token,
      twitter_id: twitterId,
      expires_at: new Date(Date.now() + expires_in * 1000),
      username: twitterHandle,
    }

    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/create`,
      data: {
        agent: agentId,
        user: agent.owner,
        platform: 'twitter',
        secrets: { twitter: twitterSecrets },
        config: { twitter: { username: twitterHandle } },
      },
    }

    await axios.post(modalRequest.endpoint, modalRequest.data, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    })

    // Redirect back to agent settings
    const redirectUrl = `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`

    return sendPopupResponse({
      success: true,
      message: 'Twitter connected successfully',
      type: 'twitter-integration-link',
      redirectUrl,
      payload: {
        twitterHandle,
        agentId,
      },
    })
  } catch (error) {
    console.error(
      'Twitter Integration OAuth error:',
      (error as any).response?.data || error,
    )
    return sendPopupResponse({
      success: false,
      message: 'Failed to connect Twitter account for integration',
      type: 'twitter-integration-link',
    })
  }
}

export const disconnectTwitterIntegration = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { agentId } = request.query as { agentId: string }

    if (!agentId) {
      return reply.status(400).send({
        message: 'Missing agentId',
      })
    }

    // Remove Twitter deployment
    // Verify the caller owns the agent. These disconnect handlers previously
    // deleted a Deployment keyed only on the agentId from the query string and
    // never read request.user, so any authenticated caller could unlink any
    // agent's social account. Same check used by createFarcasterManagedSigner
    // and googleCalendarOAuthInit in this file.
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found',
      })
    }

    if (agent.owner.toString() !== request.user.userId.toString()) {
      return reply.status(403).send({
        message: 'Not authorized to modify this agent',
      })
    }

    await Deployment.deleteOne({
      agent: agentId,
      platform: 'twitter',
    })

    return reply.status(200).send({
      message: 'Twitter integration disconnected successfully',
    })
  } catch (error) {
    console.error('Twitter integration disconnect error:', error)
    return reply
      .status(500)
      .send({ message: 'Failed to disconnect Twitter integration' })
  }
}

export const createFarcasterManagedSigner = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { agentId } = request.body as { agentId: string }

    if (!agentId) {
      return reply.status(400).send({
        message: 'Missing agentId',
      })
    }

    // Get agent to verify ownership
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found',
      })
    }

    // Verify user owns the agent
    if (agent.owner.toString() !== request.user.userId.toString()) {
      console.error('Unauthorized user:', request.user.userId.toString())
      console.error('Agent owner:', agent.owner.toString())
      console.error('Agent ID:', agentId)
      return reply.status(403).send({
        message: 'Unauthorized',
      })
    }

    const neynarApiKey = server.config.NEYNAR_API_KEY
    const farcasterDeveloperMnemonic =
      server.config.FARCASTER_DEVELOPER_MNEMONIC

    if (!neynarApiKey || !farcasterDeveloperMnemonic) {
      console.error('Missing Neynar configuration')
      return reply.status(500).send({
        message: 'Neynar configuration not available',
      })
    }

    // Use @neynar/nodejs-sdk for managed signer creation
    const neynarClient = new NeynarAPIClient({ apiKey: neynarApiKey })

    // Create signer
    const signer = await neynarClient.createSigner()
    const { signer_uuid, public_key } = signer

    // Sign the public key using developer's mnemonic
    const account = mnemonicToAccount(farcasterDeveloperMnemonic)
    const appFid = parseInt(server.config.FARCASTER_DEVELOPER_FID || '0')

    if (!appFid) {
      return reply.status(500).send({
        message: 'Farcaster developer FID not configured',
      })
    }

    const eip712signer = new ViemLocalEip712Signer(account)
    const deadline = Math.floor(Date.now() / 1000) + 86400 // 24 hours from now

    // Convert hex string to Uint8Array (strip 0x prefix if present)
    const hexString = public_key.startsWith('0x')
      ? public_key.slice(2)
      : public_key
    const publicKeyBytes = new Uint8Array(
      hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)),
    )

    const signedKeyRequestResult =
      await eip712signer.getSignedKeyRequestMetadata({
        requestFid: BigInt(appFid.toString()),
        key: publicKeyBytes,
        deadline: BigInt(deadline.toString()),
      })

    if (signedKeyRequestResult.isErr()) {
      throw new Error(
        `Failed to sign key: ${signedKeyRequestResult.error.message}`,
      )
    }

    const fullSignatureHex = Buffer.from(signedKeyRequestResult.value).toString(
      'hex',
    )

    // Extract the actual signature from ABI-encoded data
    // Find the signature length marker (0x41 = 65 bytes) and extract 130 chars after it
    const lengthMarker =
      '0000000000000000000000000000000000000000000000000000000000000041'
    const lengthMarkerIndex = fullSignatureHex.indexOf(lengthMarker)

    if (lengthMarkerIndex === -1) {
      throw new Error(
        'Could not find signature length marker in ABI-encoded data',
      )
    }

    // Signature starts right after the length marker (64 chars for the marker + 130 for signature)
    const signatureStartIndex = lengthMarkerIndex + lengthMarker.length
    const signatureHex = fullSignatureHex.slice(
      signatureStartIndex,
      signatureStartIndex + 130,
    )

    const registerPayload = {
      signerUuid: signer_uuid,
      signature: `0x${signatureHex}`,
      appFid: appFid,
      deadline: deadline,
      sponsor: {
        sponsored_by_neynar: true,
      },
    }

    // Register the signed key
    const registeredSigner = await neynarClient.registerSignedKey(
      registerPayload,
    )

    // Use the signer_approval_url from the response
    const signerApprovalUrl = registeredSigner.signer_approval_url

    if (!signerApprovalUrl) {
      throw new Error('No signer_approval_url returned from Neynar')
    }

    return reply.status(200).send({
      signer_uuid,
      public_key,
      status: 'pending_approval',
      signer_approval_url: signerApprovalUrl,
    })
  } catch (error) {
    console.error(
      'Create Farcaster managed signer error:',
      (error as any).response?.data || error,
    )
    return reply
      .status(500)
      .send({ message: 'Failed to create managed signer' })
  }
}

export const getFarcasterSignerStatus = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { signerUuid } = request.query as { signerUuid: string }

    if (!signerUuid) {
      return reply.status(400).send({
        message: 'Missing signerUuid',
      })
    }

    const neynarApiKey = server.config.NEYNAR_API_KEY
    if (!neynarApiKey) {
      return reply.status(500).send({
        message: 'Neynar configuration not available',
      })
    }

    // Use Neynar SDK to get signer status
    const neynarClient = new NeynarAPIClient({ apiKey: neynarApiKey })

    const signerStatus = await neynarClient.lookupSigner({
      signerUuid: signerUuid,
    })

    return reply.status(200).send(signerStatus)
  } catch (error) {
    console.error('Get Farcaster signer status error:', error)
    return reply.status(500).send({ message: 'Failed to get signer status' })
  }
}

// Google Calendar OAuth scopes
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
]

export const googleCalendarOAuthInit = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { agentId } = request.query as { agentId: string }

    if (!agentId) {
      return reply.status(400).send({
        message: 'Missing agentId',
      })
    }

    const clientId = server.config.GOOGLE_CALENDAR_CLIENT_ID
    if (!clientId) {
      return reply.status(500).send({
        message: 'Google Calendar OAuth not configured',
      })
    }

    // Verify agent exists and user owns it
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found',
      })
    }

    if (agent.owner.toString() !== request.user.userId.toString()) {
      return reply.status(403).send({
        message: 'Unauthorized',
      })
    }

    // Build Google OAuth URL
    const redirectUri = `${server.config.API_URL}/v2/auth/google-calendar/callback`
    const state = agentId // Pass agentId in state

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', GOOGLE_CALENDAR_SCOPES.join(' '))
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)

    return reply.status(200).send({
      authorization_url: authUrl.toString(),
    })
  } catch (error) {
    console.error('Google Calendar OAuth init error:', error)
    return reply.status(500).send({
      message: 'Failed to initialize Google Calendar OAuth',
    })
  }
}

export const googleCalendarOAuthCallback = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { code, state, error } = request.query as {
    code?: string
    state: string
    error?: string
  }

  const agentId = state

  // Helper to send popup response
  const sendPopupResponse = (data: {
    success: boolean
    message?: string
    result?: unknown
  }) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Google Calendar Connection</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #1a1a2e;
      color: white;
    }
    .container { text-align: center; padding: 2rem; }
    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #3b82f6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { color: #22c55e; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>${data.success ? 'Connected successfully!' : 'Processing...'}</p>
    ${
      data.message && !data.success
        ? `<p class="error">${data.message}</p>`
        : ''
    }
  </div>
  <script>
    (function() {
      const data = ${JSON.stringify(data)};
      if (window.opener) {
        window.opener.postMessage({ type: 'google-calendar-link', ...data }, '*');
        setTimeout(() => window.close(), 1500);
      } else {
        document.querySelector('.container').innerHTML =
          '<p class="' + (data.success ? 'success' : 'error') + '">' +
          (data.success ? 'Google Calendar connected!' : (data.message || 'Failed')) +
          '</p><p>You can close this window.</p>';
      }
    })();
  </script>
</body>
</html>`
    return reply.type('text/html').send(html)
  }

  // Check if user cancelled the OAuth flow
  if (error || !code) {
    return sendPopupResponse({
      success: false,
      message: error || 'OAuth cancelled',
    })
  }

  if (!state) {
    return sendPopupResponse({
      success: false,
      message: 'Missing state parameter',
    })
  }

  try {
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return sendPopupResponse({
        success: false,
        message: 'Agent not found',
      })
    }

    const clientId = server.config.GOOGLE_CALENDAR_CLIENT_ID
    const clientSecret = server.config.GOOGLE_CALENDAR_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return sendPopupResponse({
        success: false,
        message: 'Google Calendar OAuth not configured',
      })
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${server.config.API_URL}/v2/auth/google-calendar/callback`,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const { access_token, refresh_token, expires_in, scope } =
      tokenResponse.data

    // Get user's Google account info
    let googleEmail = ''
    let googleUserId = ''
    try {
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      )
      googleEmail = userInfoResponse.data.email
      googleUserId = userInfoResponse.data.id
    } catch {
      // Continue without user info
    }

    // Fetch calendar list
    let calendars: Array<{
      id: string
      name: string
      primary: boolean
      timeZone?: string
    }> = []
    try {
      const calendarListResponse = await axios.get(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      )
      calendars = (calendarListResponse.data.items || []).map(
        (cal: {
          id: string
          summary: string
          primary?: boolean
          timeZone?: string
        }) => ({
          id: cal.id,
          name: cal.summary,
          primary: cal.primary || false,
          timeZone: cal.timeZone,
        }),
      )
    } catch (err) {
      console.error('Failed to fetch calendar list:', err)
    }

    // Return credentials and calendars to frontend via postMessage
    // The frontend will then let user select a calendar and save
    const credentials = {
      access_token,
      refresh_token,
      token_uri: 'https://oauth2.googleapis.com/token',
      client_id: clientId,
      client_secret: clientSecret,
      scopes: scope ? scope.split(' ') : GOOGLE_CALENDAR_SCOPES,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      google_user_id: googleUserId,
      google_email: googleEmail,
    }

    return sendPopupResponse({
      success: true,
      result: {
        google_email: googleEmail,
        credentials,
        calendars,
        agent_id: agentId,
        user_id: agent.owner.toString(),
      },
    })
  } catch (error) {
    console.error(
      'Google Calendar OAuth callback error:',
      (error as any).response?.data || error,
    )
    return sendPopupResponse({
      success: false,
      message: 'Failed to connect Google Calendar',
    })
  }
}

export const disconnectGoogleCalendar = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { agentId } = request.query as { agentId: string }

    if (!agentId) {
      return reply.status(400).send({
        message: 'Missing agentId',
      })
    }

    // Remove Google Calendar deployment
    // Verify the caller owns the agent. These disconnect handlers previously
    // deleted a Deployment keyed only on the agentId from the query string and
    // never read request.user, so any authenticated caller could unlink any
    // agent's social account. Same check used by createFarcasterManagedSigner
    // and googleCalendarOAuthInit in this file.
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found',
      })
    }

    if (agent.owner.toString() !== request.user.userId.toString()) {
      return reply.status(403).send({
        message: 'Not authorized to modify this agent',
      })
    }

    await Deployment.deleteOne({
      agent: agentId,
      platform: 'google_calendar',
    })

    return reply.status(200).send({
      message: 'Google Calendar disconnected successfully',
    })
  } catch (error) {
    console.error('Google Calendar disconnect error:', error)
    return reply.status(500).send({
      message: 'Failed to disconnect Google Calendar',
    })
  }
}

const DISCORD_ADMINISTRATOR = 0x8
const DISCORD_MANAGE_GUILD = 0x20

const hasGuildAdminPermissions = (permissions: number) =>
  Boolean(
    permissions & DISCORD_ADMINISTRATOR || permissions & DISCORD_MANAGE_GUILD,
  )

const fetchDiscordUser = async (accessToken: string) => {
  const response = await axios.get('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return response.data
}

const fetchDiscordBotGuilds = async (botToken: string) => {
  const response = await axios.get('https://discord.com/api/users/@me/guilds', {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  })
  return response.data
}

const fetchDiscordGuildRoles = async (botToken: string, guildId: string) => {
  const response = await axios.get(
    `https://discord.com/api/v10/guilds/${guildId}/roles`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  )
  return response.data
}

const fetchDiscordBotUser = async (botToken: string) => {
  const response = await axios.get('https://discord.com/api/v10/users/@me', {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  })
  return response.data
}

const fetchDiscordMemberRoles = async (
  botToken: string,
  guildId: string,
  userId: string,
) => {
  const response = await axios.get(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  )
  return response.data?.roles ?? []
}

const PERMISSION_VIEW_CHANNEL = 1n << 10n
const PERMISSION_SEND_MESSAGES = 1n << 11n
const PERMISSION_READ_MESSAGE_HISTORY = 1n << 16n
const PERMISSION_MANAGE_WEBHOOKS = 1n << 29n
const PERMISSION_ADMINISTRATOR = 1n << 3n
const ALL_PERMISSIONS = (1n << 53n) - 1n

type DiscordPermissionOverwrite = {
  id: string
  type: number | string
  allow: string
  deny: string
}

const parsePermissionBits = (value?: string) => {
  if (!value) return 0n
  try {
    return BigInt(value)
  } catch {
    return 0n
  }
}

const normalizeOverwriteType = (value: number | string) => {
  if (value === 0 || value === 'role') return 'role'
  if (value === 1 || value === 'member') return 'member'
  return 'unknown'
}

const computeGuildBasePermissions = (
  roles: Array<{ id: string; permissions: string }>,
  memberRoleIds: string[],
  guildId: string,
) => {
  const rolesById = new Map<string, bigint>()
  let hasAdmin = false

  for (const role of roles) {
    const perms = parsePermissionBits(role.permissions)
    rolesById.set(role.id, perms)
    if ((perms & PERMISSION_ADMINISTRATOR) === PERMISSION_ADMINISTRATOR) {
      if (memberRoleIds.includes(role.id) || role.id === guildId) {
        hasAdmin = true
      }
    }
  }

  if (hasAdmin) {
    return ALL_PERMISSIONS
  }

  let base = rolesById.get(guildId) ?? 0n
  for (const roleId of memberRoleIds) {
    base |= rolesById.get(roleId) ?? 0n
  }

  return base
}

const applyChannelOverwrites = (
  basePermissions: bigint,
  overwrites: DiscordPermissionOverwrite[] | undefined,
  memberRoleIds: string[],
  memberId: string,
  guildId: string,
) => {
  if (!overwrites || overwrites.length === 0) return basePermissions

  const normalized = overwrites.map(overwrite => ({
    id: overwrite.id,
    type: normalizeOverwriteType(overwrite.type),
    allow: parsePermissionBits(overwrite.allow),
    deny: parsePermissionBits(overwrite.deny),
  }))

  let permissions = basePermissions

  const everyoneOverwrite = normalized.find(
    overwrite => overwrite.type === 'role' && overwrite.id === guildId,
  )
  if (everyoneOverwrite) {
    permissions =
      (permissions & ~everyoneOverwrite.deny) | everyoneOverwrite.allow
  }

  let roleAllow = 0n
  let roleDeny = 0n
  for (const overwrite of normalized) {
    if (overwrite.type !== 'role') continue
    if (!memberRoleIds.includes(overwrite.id)) continue
    roleAllow |= overwrite.allow
    roleDeny |= overwrite.deny
  }

  permissions = (permissions & ~roleDeny) | roleAllow

  const memberOverwrite = normalized.find(
    overwrite => overwrite.type === 'member' && overwrite.id === memberId,
  )
  if (memberOverwrite) {
    permissions = (permissions & ~memberOverwrite.deny) | memberOverwrite.allow
  }

  return permissions
}

const hasPermission = (permissions: bigint, flag: bigint) =>
  (permissions & flag) === flag

const fetchDiscordChannelWebhooks = async (
  botToken: string,
  channelId: string,
) => {
  const response = await axios.get(
    `https://discord.com/api/v10/channels/${channelId}/webhooks`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  )
  return response.data
}

const fetchDiscordChannel = async (botToken: string, channelId: string) => {
  const response = await axios.get(
    `https://discord.com/api/v10/channels/${channelId}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  )
  return response.data
}

const checkBotInGuild = async (botToken: string, guildId: string) => {
  try {
    await axios.get(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    })
    return true
  } catch {
    return false
  }
}

const userIsGuildAdmin = async (
  botToken: string,
  guildId: string,
  userDiscordId: string,
) => {
  const [guildResponse, memberRoles, roles] = await Promise.all([
    axios.get(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    }),
    fetchDiscordMemberRoles(botToken, guildId, userDiscordId),
    fetchDiscordGuildRoles(botToken, guildId),
  ])

  if (guildResponse.data?.owner_id === userDiscordId) {
    return true
  }

  const permissionsByRole = new Map<string, number>(
    roles.map((role: any) => [
      String(role.id),
      Number.parseInt(String(role.permissions ?? '0'), 10),
    ]),
  )
  const roleIds = Array.from(new Set([guildId, ...memberRoles]))
  return roleIds.some(roleId =>
    hasGuildAdminPermissions(permissionsByRole.get(roleId) ?? 0),
  )
}

export const discordV3OAuthCallback = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { code, state, error } = request.query as {
    code?: string
    state: string
    error?: string
  }

  const sendPopupResponse = (
    success: boolean,
    guilds?: any[],
    message?: string,
  ) => {
    const targetOrigin = server.config.EDEN2_FRONTEND_URL || '*'
    const payload = JSON.stringify({
      type: 'discord-v3-config',
      success,
      guilds: guilds || [],
      message,
    })
    return reply.type('text/html').send(`<!DOCTYPE html>
<html>
  <head>
    <title>Discord Server Selection</title>
  </head>
  <body>
    <p>Loading your Discord servers...</p>
    <script>
      ;(function() {
        try {
          if (window.opener) {
            window.opener.postMessage(${payload}, ${JSON.stringify(
      targetOrigin,
    )})
          }
        } catch (err) {
          console.error(err)
        }
        setTimeout(() => window.close(), 1500)
      })()
    </script>
  </body>
</html>`)
  }

  if (error) {
    return sendPopupResponse(false, undefined, error)
  }

  if (!code || !state) {
    return sendPopupResponse(false, undefined, 'Missing code or state')
  }

  let parsedState:
    | { agent_id?: string; mode?: string; user_id?: string }
    | undefined
  try {
    parsedState = JSON.parse(state)
  } catch {
    return sendPopupResponse(false, undefined, 'Invalid state')
  }

  const agentId = parsedState?.agent_id
  if (!agentId) {
    return sendPopupResponse(false, undefined, 'Missing agent_id in state')
  }

  // Verify agent exists
  const agent = await Agent.findById(agentId)
  if (!agent) {
    return sendPopupResponse(false, undefined, 'Agent not found')
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: server.config.DISCORD_CLIENT_ID as string,
        client_secret: server.config.DISCORD_CLIENT_SECRET as string,
        code,
        redirect_uri: `${server.config.API_URL}/v2/deployments/discord/oauth/callback`,
        grant_type: 'authorization_code',
        scope: 'guilds identify',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const { access_token } = tokenResponse.data

    const [discordUser, guildsResponse] = await Promise.all([
      fetchDiscordUser(access_token),
      axios.get('https://discord.com/api/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    ])

    const discordUserId = discordUser?.id
    const discordUsername = discordUser?.username
    const userIdFromState = parsedState?.user_id
    const allGuilds = guildsResponse.data

    const botToken = server.config.DISCORD_BOT_TOKEN
    if (!botToken) {
      return sendPopupResponse(
        false,
        undefined,
        'Discord bot token not configured',
      )
    }
    const availableGuilds = []
    const guildIds = allGuilds.map((guild: any) => guild.id)
    const accessDocs = await DiscordGuildAccess.find({
      guild_id: { $in: guildIds },
    })
    const accessByGuild = new Map(
      accessDocs.map(doc => [doc.guild_id, doc.allowed_role_ids ?? []]),
    )

    for (const guild of allGuilds) {
      const permissions = parseInt(guild.permissions)
      const isAdmin = hasGuildAdminPermissions(permissions)
      const allowedRoleIds = accessByGuild.get(guild.id) ?? []

      if (!isAdmin && allowedRoleIds.length === 0) {
        continue
      }

      if (!isAdmin && !discordUserId) {
        continue
      }

      const hasBot = await checkBotInGuild(botToken, guild.id)
      if (!hasBot) {
        continue
      }

      if (!isAdmin && discordUserId) {
        try {
          const memberRoles = await fetchDiscordMemberRoles(
            botToken,
            guild.id,
            discordUserId,
          )
          const isRoleAllowed = allowedRoleIds.some(roleId =>
            memberRoles.includes(roleId),
          )
          if (!isRoleAllowed) {
            continue
          }
        } catch {
          continue
        }
      }

      availableGuilds.push({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: guild.owner || false,
        access: isAdmin ? 'admin' : 'role',
      })
    }

    if (discordUserId && userIdFromState) {
      let user = await User.findOne({ userId: userIdFromState })
      if (!user && server.mongoose?.isObjectIdOrHexString?.(userIdFromState)) {
        user = await User.findById(userIdFromState)
      }
      if (user) {
        user.discordId = discordUserId
        if (discordUsername) {
          user.discordUsername = discordUsername
        }
        await user.save()
      }
    }

    return sendPopupResponse(true, availableGuilds)
  } catch (error: any) {
    server.log.error({ error }, 'Discord V3 OAuth error')
    return sendPopupResponse(false, undefined, 'Failed to load Discord servers')
  }
}

export const getDiscordAvailableGuilds = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const botToken = server.config.DISCORD_BOT_TOKEN

  if (!botToken) {
    return reply.status(500).send({
      message: 'Discord bot token not configured',
    })
  }

  if (!request.user?.userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const user = await User.findById(request.user.userId)
  if (!user?.discordId) {
    return reply.status(400).send({
      message: 'Discord account not linked for this user',
    })
  }

  try {
    const botGuilds = await fetchDiscordBotGuilds(botToken)
    const guildIds = botGuilds.map((guild: any) => guild.id)
    const accessDocs = await DiscordGuildAccess.find({
      guild_id: { $in: guildIds },
    })
    const accessByGuild = new Map(
      accessDocs.map(doc => [doc.guild_id, doc.allowed_role_ids ?? []]),
    )

    const availableGuilds = []

    for (const guild of botGuilds) {
      try {
        const [guildResponse, memberRoles, roles] = await Promise.all([
          axios.get(`https://discord.com/api/v10/guilds/${guild.id}`, {
            headers: {
              Authorization: `Bot ${botToken}`,
            },
          }),
          fetchDiscordMemberRoles(botToken, guild.id, user.discordId),
          fetchDiscordGuildRoles(botToken, guild.id),
        ])

        const isOwner = guildResponse.data?.owner_id === user.discordId
        const permissionsByRole = new Map<string, number>(
          roles.map((role: any) => [
            String(role.id),
            Number.parseInt(String(role.permissions ?? '0'), 10),
          ]),
        )
        const roleIds = Array.from(new Set([guild.id, ...memberRoles]))
        const isAdmin =
          isOwner ||
          roleIds.some(roleId =>
            hasGuildAdminPermissions(permissionsByRole.get(roleId) ?? 0),
          )

        const allowedRoleIds = accessByGuild.get(guild.id) ?? []

        if (!isAdmin && allowedRoleIds.length === 0) {
          continue
        }

        if (!isAdmin) {
          const isRoleAllowed = allowedRoleIds.some(roleId =>
            memberRoles.includes(roleId),
          )
          if (!isRoleAllowed) {
            continue
          }
        }

        availableGuilds.push({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: isOwner,
          access: isAdmin ? 'admin' : 'role',
        })
      } catch {
        continue
      }
    }

    return reply.send({ guilds: availableGuilds })
  } catch (error: any) {
    server.log.error({ error }, 'Failed to refresh Discord guilds')
    return reply.status(500).send({
      message: 'Failed to refresh Discord servers',
    })
  }
}

export const getDiscordGuildChannels = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { guildId } = request.params as { guildId: string }
  const botToken = server.config.DISCORD_BOT_TOKEN

  try {
    type ChannelPermissions = {
      can_view: boolean
      can_read_history: boolean
      can_send: boolean
      can_manage_webhooks: boolean
    }
    type ChannelValidation = {
      errors: string[]
      warnings: string[]
      has_webhook: boolean | null
    }
    type ChannelWithPermissions = {
      id: string
      name: string
      type: number
      permissions: ChannelPermissions
      validation: ChannelValidation
    }

    if (!botToken) {
      return reply.status(500).send({
        message: 'Discord bot token not configured',
      })
    }

    const [channelsResponse, botUser, roles] = await Promise.all([
      axios.get(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }),
      fetchDiscordBotUser(botToken),
      fetchDiscordGuildRoles(botToken, guildId),
    ])

    const botUserId = botUser?.id
    if (!botUserId) {
      return reply.status(500).send({
        message: 'Discord bot identity unavailable',
      })
    }

    const memberRoleIds = await fetchDiscordMemberRoles(
      botToken,
      guildId,
      botUserId,
    )
    const basePermissions = computeGuildBasePermissions(
      roles,
      memberRoleIds,
      guildId,
    )

    const allChannels = channelsResponse.data

    // Filter to text channels only (type 0 = GUILD_TEXT, type 5 = GUILD_NEWS)
    const textChannels = allChannels.filter(
      (ch: any) => ch.type === 0 || ch.type === 5,
    )

    const withPermissions: ChannelWithPermissions[] = textChannels.map(
      (ch: any) => {
        const permissions = applyChannelOverwrites(
          basePermissions,
          ch.permission_overwrites as DiscordPermissionOverwrite[] | undefined,
          memberRoleIds,
          botUserId,
          guildId,
        )
        const canView = hasPermission(permissions, PERMISSION_VIEW_CHANNEL)
        const canReadHistory = hasPermission(
          permissions,
          PERMISSION_READ_MESSAGE_HISTORY,
        )
        const canSend = hasPermission(permissions, PERMISSION_SEND_MESSAGES)
        const canManageWebhooks = hasPermission(
          permissions,
          PERMISSION_MANAGE_WEBHOOKS,
        )

        const errors: string[] = []
        if (!canView) errors.push('missing_view_channel')
        if (!canReadHistory) errors.push('missing_read_message_history')
        if (!canManageWebhooks) errors.push('missing_manage_webhooks')

        const warnings: string[] = []
        if (!canSend) warnings.push('missing_send_messages')

        return {
          id: ch.id,
          name: ch.name,
          type: ch.type,
          permissions: {
            can_view: canView,
            can_read_history: canReadHistory,
            can_send: canSend,
            can_manage_webhooks: canManageWebhooks,
          },
          validation: {
            errors,
            warnings,
            has_webhook: null as boolean | null,
          },
        }
      },
    )

    const webhookName = 'Eden Agent Webhook'
    const channelsToCheck = withPermissions.filter(
      (channel: ChannelWithPermissions) =>
        channel.permissions.can_manage_webhooks &&
        channel.validation.errors.length === 0,
    )
    const batchSize = 8
    for (let i = 0; i < channelsToCheck.length; i += batchSize) {
      const batch = channelsToCheck.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async (channel: ChannelWithPermissions) => {
          try {
            const webhooks = await fetchDiscordChannelWebhooks(
              botToken,
              channel.id,
            )
            const hasWebhook = Array.isArray(webhooks)
              ? webhooks.some((hook: any) => hook?.name === webhookName)
              : false
            return { id: channel.id, hasWebhook }
          } catch {
            return { id: channel.id, hasWebhook: false }
          }
        }),
      )

      for (const result of results) {
        const channel = withPermissions.find(
          (channel: ChannelWithPermissions) => channel.id === result.id,
        )
        if (!channel) continue
        channel.validation.has_webhook = result.hasWebhook
        if (!result.hasWebhook) {
          channel.validation.warnings.push('missing_webhook')
        }
      }
    }

    return reply.send({ channels: withPermissions })
  } catch (error: any) {
    server.log.error({ error, guildId }, 'Failed to fetch guild channels')
    return reply.status(500).send({
      message: 'Failed to fetch channels',
    })
  }
}

export const getDiscordGuildRoles = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { guildId } = request.params as { guildId: string }
  const botToken = server.config.DISCORD_BOT_TOKEN

  if (!botToken) {
    return reply.status(500).send({
      message: 'Discord bot token not configured',
    })
  }

  try {
    const roles = await fetchDiscordGuildRoles(botToken, guildId)
    const filteredRoles = roles
      .filter((role: any) => role.id !== guildId)
      .map((role: any) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        managed: role.managed,
      }))

    return reply.send({ roles: filteredRoles })
  } catch (error: any) {
    server.log.error({ error, guildId }, 'Failed to fetch guild roles')
    return reply.status(500).send({
      message: 'Failed to fetch roles',
    })
  }
}

export const validateDiscordBotChannels = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { token, channelIds, channels } = request.body as {
    token?: string
    channelIds?: string[]
    channels?: Array<{ id: string; readOnly?: boolean }>
  }

  const normalizedChannels: Array<{ id: string; readOnly?: boolean }> =
    Array.isArray(channels) && channels.length > 0
      ? channels
      : (channelIds || []).map(id => ({ id, readOnly: false }))

  if (!token || normalizedChannels.length === 0) {
    return reply.status(400).send({
      message: 'Missing bot token or channel ids',
    })
  }

  try {
    const botUser = await fetchDiscordBotUser(token)
    const botUserId = botUser?.id
    if (!botUserId) {
      return reply.status(400).send({
        message: 'Invalid Discord bot token',
      })
    }

    const guildCache = new Map<
      string,
      { roles: any[]; memberRoleIds: string[]; basePermissions: bigint }
    >()

    const results = []

    for (const channelInput of normalizedChannels) {
      const channelId = channelInput.id
      try {
        const channel = await fetchDiscordChannel(token, channelId)
        const guildId = channel?.guild_id
        if (!guildId) {
          results.push({
            id: channelId,
            name: channel?.name ?? channelId,
            guild_id: null,
            permissions: null,
            read_only: channelInput.readOnly ?? false,
            validation: { errors: ['missing_guild_id'] },
          })
          continue
        }

        let guildInfo = guildCache.get(guildId)
        if (!guildInfo) {
          const [roles, memberRoleIds] = await Promise.all([
            fetchDiscordGuildRoles(token, guildId),
            fetchDiscordMemberRoles(token, guildId, botUserId),
          ])
          const basePermissions = computeGuildBasePermissions(
            roles,
            memberRoleIds,
            guildId,
          )
          guildInfo = { roles, memberRoleIds, basePermissions }
          guildCache.set(guildId, guildInfo)
        }

        const permissions = applyChannelOverwrites(
          guildInfo.basePermissions,
          channel.permission_overwrites as
            | DiscordPermissionOverwrite[]
            | undefined,
          guildInfo.memberRoleIds,
          botUserId,
          guildId,
        )
        const canView = hasPermission(permissions, PERMISSION_VIEW_CHANNEL)
        const canReadHistory = hasPermission(
          permissions,
          PERMISSION_READ_MESSAGE_HISTORY,
        )
        const canSend = hasPermission(permissions, PERMISSION_SEND_MESSAGES)

        const errors: string[] = []
        if (!canView) errors.push('missing_view_channel')
        if (!canReadHistory) errors.push('missing_read_message_history')
        if (!channelInput.readOnly && !canSend) {
          errors.push('missing_send_messages')
        }

        results.push({
          id: channelId,
          name: channel?.name ?? channelId,
          guild_id: guildId,
          permissions: {
            can_view: canView,
            can_read_history: canReadHistory,
            can_send: canSend,
          },
          read_only: channelInput.readOnly ?? false,
          validation: { errors },
        })
      } catch {
        results.push({
          id: channelId,
          name: channelId,
          guild_id: null,
          permissions: null,
          read_only: channelInput.readOnly ?? false,
          validation: { errors: ['channel_not_found'] },
        })
      }
    }

    return reply.send({ channels: results })
  } catch (error: any) {
    server.log.error({ error }, 'Failed to validate Discord channels')
    return reply.status(500).send({
      message: 'Failed to validate Discord channels',
    })
  }
}

export const getDiscordGuildAccess = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { guildId } = request.params as { guildId: string }

  try {
    const access = await DiscordGuildAccess.findOne({ guild_id: guildId })
    return reply.send({
      guildId,
      allowedRoleIds: access?.allowed_role_ids ?? [],
    })
  } catch (error: any) {
    server.log.error({ error, guildId }, 'Failed to fetch guild access roles')
    return reply.status(500).send({
      message: 'Failed to fetch access roles',
    })
  }
}

export const updateDiscordGuildAccess = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { guildId } = request.params as { guildId: string }
  const { allowedRoleIds } = request.body as { allowedRoleIds?: string[] }
  const botToken = server.config.DISCORD_BOT_TOKEN

  if (!botToken) {
    return reply.status(500).send({
      message: 'Discord bot token not configured',
    })
  }

  if (!request.user?.userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const user = await User.findById(request.user.userId)
  if (!user?.discordId) {
    return reply.status(400).send({
      message: 'Discord account not linked for this user',
    })
  }

  try {
    const canManage = await userIsGuildAdmin(botToken, guildId, user.discordId)

    if (!canManage) {
      return reply.status(403).send({
        message: 'You do not have permission to manage this server',
      })
    }

    const sanitizedRoles = Array.from(
      new Set((allowedRoleIds ?? []).filter(roleId => Boolean(roleId))),
    )

    const access = await DiscordGuildAccess.findOneAndUpdate(
      { guild_id: guildId },
      {
        guild_id: guildId,
        allowed_role_ids: sanitizedRoles,
        updated_by_user_id: user._id,
        updated_by_discord_id: user.discordId,
      },
      { upsert: true, new: true },
    )

    return reply.send({
      guildId,
      allowedRoleIds: access?.allowed_role_ids ?? [],
    })
  } catch (error: any) {
    server.log.error({ error, guildId }, 'Failed to update guild access roles')
    return reply.status(500).send({
      message: 'Failed to update access roles',
    })
  }
}
