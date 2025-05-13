import { User } from '../../../models/User'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const discordOAuth = async (
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
    if (!discordId) {
      return reply.status(400).send({
        message: 'Discord user not found',
      })
    }

    // Check to make sure this discordId isn't already in use
    const existingUsers = await User.find({ discordId })

    // Check if any existing user has this Discord ID
    for (const existingUser of existingUsers) {
      if (
        existingUser.userId &&
        existingUser._id.toString() !== user._id.toString()
      ) {
        return reply.status(400).send({
          message: 'This Discord account is already connected to another user',
        })
      }
    }

    user.discordId = discordId
    await user.save()

    // Give delegated creations to the user
    // const creations = await CreationV2.find({
    //   'attributes.discordId': discordId.toString(),
    //   userId: { $ne: user._id },
    // })
    // await Promise.all(
    //   creations.map(async creation => {
    //     creation.user = user._id
    //     await creation.save()
    //   }),
    // )

    return reply.redirect(
      `${server.config.EDEN2_FRONTEND_URL}/settings/integrations`,
    )
  } catch (error) {
    console.error(error)
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
    await user.save()

    return reply.redirect(
      `${server.config.EDEN2_FRONTEND_URL}/settings/integrations`,
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
