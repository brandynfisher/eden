import { User } from '../../../models/User'
import { CreationV2 } from '../../../models/v2/CreationV2'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const discordOAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  console.log('discordOAuth')

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
        redirect_uri: `${server.config.API_URL}/auth/discord/callback`,
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
    await User.findOne({ discordId }).then(existingUser => {
      if (existingUser) {
        return reply.status(400).send({
          message: 'Discord already in use',
        })
      }
    })

    user.discordId = discordId
    await user.save()

    // Give delegated creations to the user
    const creations = await CreationV2.find({
      'attributes.discordId': discordId.toString(),
      userId: { $ne: user._id },
    })
    await Promise.all(
      creations.map(async creation => {
        creation.user = user._id
        await creation.save()
      }),
    )

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
