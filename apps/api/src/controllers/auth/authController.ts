import { Collection } from '../../models/Collection'
import { Creation } from '../../models/Creation'
import { Manna } from '../../models/Manna'
import { Transaction } from '../../models/Transaction'
import { User, UserInput } from '../../models/User'
import { UserIdentity } from '../../models/UserIdentity'
import { CreationV2 } from '../../models/v2/CreationV2'
import {
  linkUserIdentity,
  unlinkUserIdentity,
} from '../../services/userIdentityService'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

type DiscordOAuthQuery = {
  code?: string
  state?: string
  mode?: string
}

export const createNewUser = async (
  server: FastifyInstance,
  input: UserInput,
) => {
  const newUser = new User({ ...input, type: 'user' })
  await newUser.save()

  // Give them a default collection
  const collection = new Collection({
    user: newUser._id,
    name: 'Bookmarks',
    description: 'My bookmarked creations',
    isDefaultCollection: true,
  })
  await collection.save()

  // Give them free Manna
  const newManna = new Manna({
    user: newUser._id,
    balance: server.config.MANNA_BONUS_SIGNUP,
  })
  await newManna.save()
  return newUser
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
    const targetOrigin = server.config.FRONTEND_URL || '*'
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
    const discordUsername = userResponse.data.username
    if (!discordId) {
      if (isPopupFlow) {
        return sendPopupResponse(false, 'Discord user not found')
      }
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
      if (isPopupFlow) {
        return sendPopupResponse(false, 'Discord already in use')
      }
      return reply.status(400).send({
        message: 'Discord already in use',
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
    await Creation.updateMany(
      {
        'attributes.discordId': discordId.toString(),
        $or: [
          { user: { $ne: user._id } },
          { eden_user_id: { $ne: user.eden_user_id } },
        ],
      },
      { $set: { user: user._id, eden_user_id: user.eden_user_id } },
    )

    await Manna.findOneAndUpdate({ user: user._id }, { $inc: { balance: 50 } })

    if (isPopupFlow) {
      return sendPopupResponse(true)
    }

    return reply.redirect(`${server.config.FRONTEND_URL}/account`)
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

export const disconnectDiscord = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const user = await User.findById(userId)

  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const discordId = user.discordId

  user.discordId = undefined
  user.discordUsername = undefined
  await user.save()

  if (discordId) {
    try {
      await unlinkUserIdentity({
        provider: 'discord',
        provider_user_id: discordId.toString(),
        actor_eden_user_id: user.eden_user_id ?? user._id,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('does not exist and cannot be unlinked')) {
        throw error
      }
    }

    await CreationV2.updateMany(
      {
        user: user._id,
        'attributes.discordId': discordId.toString(),
      },
      {
        $set: { eden_user_id: null },
      },
    )

    await Creation.updateMany(
      {
        user: user._id,
        'attributes.discordId': discordId.toString(),
      },
      {
        $set: { eden_user_id: null },
      },
    )
  }

  return reply.status(200).send({})
}

export const claimDailyLoginBonus = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}

  if (!userId) {
    return reply.status(401).send({
      message: 'User missing from request',
    })
  }

  const user = await User.findById(userId)

  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const userManna = await Manna.findOne({ user: user._id })

  if (!userManna) {
    return reply.status(400).send({
      message: 'User manna not found',
    })
  }

  const now = new Date()
  const lastDailyLogin = user.lastDailyLoginBonus

  const claimAmount = server.config.MANNA_BONUS_DAILY_LOGIN

  const isSameUtcDay = (a: Date, b: Date) =>
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()

  const hasClaimedToday =
    lastDailyLogin instanceof Date && isSameUtcDay(lastDailyLogin, now)

  if (!hasClaimedToday) {
    await User.updateOne(
      { _id: user._id },
      { $set: { lastDailyLoginBonus: now } },
    )

    userManna.balance += claimAmount
    await userManna.save()

    const transaction = new Transaction({
      manna: userManna._id,
      amount: claimAmount,
      type: 'daily_login_bonus',
    })
    await transaction.save()

    return reply.status(200).send({
      claimed: claimAmount,
    })
  }

  return reply.status(200).send({
    claimed: 0,
    lastDailyLogin: user.lastDailyLoginBonus,
  })
}
