import { Agent } from '../../../models/Agent'
import { Deployment } from '../../../models/Deployment'
import { Manna } from '../../../models/Manna'
import { Transaction } from '../../../models/Transaction'
import { User } from '../../../models/User'
import { UserIdentity } from '../../../models/UserIdentity'
import { CreationV2 } from '../../../models/v2/CreationV2'
import { linkUserIdentity } from '../../../services/userIdentityService'
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

  // State contains the agentId
  const agentId = state

  // Check if user cancelled the OAuth flow
  if (error || !code) {
    // Get agent to redirect back to their settings
    const agent = await Agent.findById(agentId)
    if (agent) {
      const redirectUrl = `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`
      return reply.redirect(redirectUrl)
    }
    return reply.status(400).send({
      message: 'OAuth cancelled or failed',
    })
  }

  if (!state) {
    return reply.status(400).send({
      message: 'Missing state parameter',
    })
  }

  try {
    // Get agent to find the owner
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found',
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
      return reply.status(400).send({
        message: 'Invalid credentials received from TikTok',
      })
    }

    // Get user info to get username
    let username = ''
    try {
      const userInfoResponse = await axios.get(
        'https://open.tiktokapis.com/v2/user/info/',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          params: {
            fields: 'display_name,username',
          },
        },
      )

      if (userInfoResponse.data?.data?.user) {
        username = userInfoResponse.data.data.user.username
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
        config: { tiktok: {} },
      },
    }

    await axios.post(modalRequest.endpoint, modalRequest.data, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    })

    // Redirect back to agent settings
    const redirectUrl = `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`

    return reply.redirect(redirectUrl)
  } catch (error) {
    console.error('TikTok OAuth error:', error)
    return reply
      .status(500)
      .send({ message: 'Failed to connect TikTok account' })
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

  // State contains the agentId
  const agentId = state

  // Check if user cancelled the OAuth flow
  if (error || !code) {
    // Get agent to redirect back to their settings
    const agent = await Agent.findById(agentId)
    if (agent) {
      const redirectUrl = `${server.config.EDEN2_FRONTEND_URL}/chat/${agent.username}?page=settings&tab=integrations`
      return reply.redirect(redirectUrl)
    }
    return reply.status(400).send({
      message: 'OAuth cancelled or failed',
    })
  }

  if (!state) {
    return reply.status(400).send({
      message: 'Missing state parameter',
    })
  }

  try {
    // Get agent to find the owner
    const agent = await Agent.findById(agentId)
    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found',
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
      return reply.status(400).send({
        message: 'Twitter username or ID not found',
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

    return reply.redirect(redirectUrl)
  } catch (error) {
    console.error(
      'Twitter Integration OAuth error:',
      (error as any).response?.data || error,
    )
    return reply
      .status(500)
      .send({ message: 'Failed to connect Twitter account for integration' })
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
