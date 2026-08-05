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

  // Record the grant. Seeding the balance without a matching transaction made
  // the ledger unreconcilable from day one: every account's stored balance sat
  // exactly MANNA_BONUS_SIGNUP above the sum of its transactions.
  if (server.config.MANNA_BONUS_SIGNUP > 0) {
    await new Transaction({
      manna: newManna._id,
      amount: server.config.MANNA_BONUS_SIGNUP,
      type: 'signup_bonus',
    }).save()
  }

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

    // NOTE: an unguarded, unlogged `$inc: {balance: 50}` used to sit here — a
    // second grant on top of the flag-guarded discord_link_bonus above, with no
    // claimed-check and no transaction, so it re-granted on every re-link. This
    // v1 handler is not routed (authRoutes only registers claimDailyLoginBonus
    // and disconnectDiscord; the live callback is authControllerV2.discordOAuth),
    // so it was never reachable — removed before it ever became reachable.

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

  const now = new Date()
  const startOfUtcDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )

  // Claim the day atomically. The previous read-then-write let concurrent
  // requests all observe "not claimed yet" and each grant a bonus — 16 real
  // user-days in production carry 2-3 bonuses because of it. Conditioning the
  // update on the stored timestamp makes exactly one request per UTC day win.
  const claimed = await User.updateOne(
    {
      _id: user._id,
      $or: [
        { lastDailyLoginBonus: { $exists: false } },
        { lastDailyLoginBonus: null },
        { lastDailyLoginBonus: { $lt: startOfUtcDay } },
      ],
    },
    { $set: { lastDailyLoginBonus: now } },
  )

  if (claimed.modifiedCount !== 1) {
    return reply.status(200).send({
      claimed: 0,
      lastDailyLogin: user.lastDailyLoginBonus,
    })
  }

  // Top up rather than accumulate: bring the user up to the daily target if
  // they are below it, and do nothing if they already hold at least that much.
  // Expressed as balance = max(balance, TARGET - subscriptionBalance) so the
  // check is against TOTAL manna, the write is atomic against concurrent task
  // charges, and a balance can never be reduced by claiming.
  const target = server.config.MANNA_BONUS_DAILY_LOGIN
  const before = await Manna.findOneAndUpdate(
    { user: user._id },
    [
      {
        $set: {
          balance: {
            $max: [
              '$balance',
              { $subtract: [target, { $ifNull: ['$subscriptionBalance', 0] }] },
            ],
          },
        },
      },
    ],
    { returnDocument: 'before' },
  )

  if (!before) {
    return reply.status(400).send({
      message: 'User manna not found',
    })
  }

  // The update applied a pure function of the pre-image, so the delta is exact.
  const newBalance = Math.max(
    before.balance,
    target - (before.subscriptionBalance || 0),
  )
  const granted = newBalance - before.balance

  if (granted > 0) {
    await new Transaction({
      manna: before._id,
      amount: granted,
      type: 'daily_login_bonus',
    }).save()
  }

  return reply.status(200).send({
    claimed: granted,
  })
}
