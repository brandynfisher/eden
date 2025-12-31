import { Agent } from '../../../models/Agent'
import { Deployment } from '../../../models/Deployment'
import { Manna } from '../../../models/Manna'
import { Transaction } from '../../../models/Transaction'
import { User } from '../../../models/User'
import { UserIdentity } from '../../../models/UserIdentity'
import { CreationV2 } from '../../../models/v2/CreationV2'
import { linkUserIdentity } from '../../../services/userIdentityService'
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

    // Check if this Twitter handle is already connected to another account
    const existingUser = await User.findOne({ twitterId })
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return reply.status(400).send({
        message: 'This Twitter account is already connected to another user',
      })
    }

    // Save Twitter handle to user
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

    // Remove Twitter handle from user
    user.twitterHandle = undefined
    await user.save()

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

  let parsedState: { agent_id?: string; mode?: string } | undefined
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
        client_id: server.config.DISCORD_OAUTH_CLIENT_ID as string,
        client_secret: server.config.DISCORD_OAUTH_CLIENT_SECRET as string,
        code,
        redirect_uri: `${server.config.API_URL}/v2/deployments/discord/oauth/callback`,
        grant_type: 'authorization_code',
        scope: 'guilds',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const { access_token } = tokenResponse.data

    // Fetch user's guilds
    const guildsResponse = await axios.get(
      'https://discord.com/api/users/@me/guilds',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )

    const allGuilds = guildsResponse.data

    // Filter guilds where user has admin/manage server permissions
    const ADMINISTRATOR = 0x8
    const MANAGE_GUILD = 0x20

    const adminGuilds = allGuilds.filter((guild: any) => {
      const permissions = parseInt(guild.permissions)
      return permissions & ADMINISTRATOR || permissions & MANAGE_GUILD
    })

    // Check which guilds have the bot
    const botToken = server.config.DISCORD_BOT_TOKEN
    const availableGuilds = []

    for (const guild of adminGuilds) {
      try {
        await axios.get(`https://discord.com/api/v10/guilds/${guild.id}`, {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        })
        // Bot is in guild
        availableGuilds.push({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: guild.owner || false,
        })
      } catch {
        // Bot not in guild, skip
      }
    }

    return sendPopupResponse(true, availableGuilds)
  } catch (error: any) {
    server.log.error({ error }, 'Discord V3 OAuth error')
    return sendPopupResponse(false, undefined, 'Failed to load Discord servers')
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
    const response = await axios.get(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      },
    )

    const allChannels = response.data

    // Filter to text channels only (type 0 = GUILD_TEXT, type 5 = GUILD_NEWS)
    const textChannels = allChannels
      .filter((ch: any) => ch.type === 0 || ch.type === 5)
      .map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
      }))

    return reply.send({ channels: textChannels })
  } catch (error: any) {
    server.log.error({ error, guildId }, 'Failed to fetch guild channels')
    return reply.status(500).send({
      message: 'Failed to fetch channels',
    })
  }
}
