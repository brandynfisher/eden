import { User } from '../models/User'
import {
  SessionPlatformFilter,
  UserPreferences,
} from '../models/UserPreferences'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const VALID_PLATFORMS: SessionPlatformFilter[] = [
  'web',
  'discord',
  'telegram',
  'twitter',
  'farcaster',
]

export const getUserPreferences = async (
  _server: FastifyInstance,
  request: FastifyRequest<{ Querystring: { populateOwner?: string } }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  const { populateOwner } = request.query

  if (!userId) {
    return reply.status(401).send({
      message: 'Unauthorized',
    })
  }

  try {
    const shouldPopulateOwner = populateOwner === 'true'

    const basePopulateOptions = {
      path: 'last_agents',
      select:
        'username userImage name _id type owner description stats website social_accounts',
      match: { deleted: { $ne: true } },
      ...(shouldPopulateOwner && {
        populate: { path: 'owner', select: 'username' },
      }),
    }

    const pinnedPopulateOptions = {
      path: 'pinned_agents',
      select:
        'username userImage name _id type owner description stats website social_accounts',
      match: { deleted: { $ne: true } },
      ...(shouldPopulateOwner && {
        populate: { path: 'owner', select: 'username' },
      }),
    }

    const preferences = await UserPreferences.findOne({ user: userId })
      .populate(basePopulateOptions)
      .populate(pinnedPopulateOptions)
      .lean()

    if (!preferences) {
      return reply.status(200).send({
        last_agents: [],
        pinned_agents: [],
        session_platform_filters: VALID_PLATFORMS,
      })
    }

    // Filter out any null entries (in case some agents were deleted)
    const validAgents = (preferences.last_agents || []).filter(
      (agent: any) => agent !== null,
    )

    const validPinnedAgents = (preferences.pinned_agents || []).filter(
      (agent: any) => agent !== null,
    )

    // Only return the top 5 agents
    const topAgents = validAgents.slice(0, 5)

    return reply.status(200).send({
      last_agents: topAgents,
      pinned_agents: validPinnedAgents,
      session_platform_filters:
        preferences.session_platform_filters || VALID_PLATFORMS,
    })
  } catch (e) {
    console.error('Error fetching user preferences:', e)
    return reply.status(500).send({
      message: 'Failed to fetch user preferences',
    })
  }
}

export const getNotificationPreferences = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}

  if (!userId) {
    return reply.status(401).send({
      message: 'Unauthorized',
    })
  }

  try {
    const user = await User.findById(userId)
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    const preferences = await UserPreferences.findOne({ user: userId }).lean()

    // Return default preferences if none exist
    const defaultPreferences = {
      new_creation: true,
      new_message: true,
      session_permissions: true,
      agent_permissions: true,
    }

    const notificationPreferences =
      preferences?.notification_preferences || defaultPreferences

    return reply.status(200).send({
      notification_preferences: notificationPreferences,
    })
  } catch (e) {
    console.error('Error fetching notification preferences:', e)
    return reply.status(500).send({
      message: 'Failed to fetch notification preferences',
    })
  }
}

export const updateNotificationPreferences = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  const { notification_preferences } = request.body as {
    notification_preferences: {
      new_creation?: boolean
      new_message?: boolean
      session_permissions?: boolean
      agent_permissions?: boolean
    }
  }

  if (!userId) {
    return reply.status(401).send({
      message: 'Unauthorized',
    })
  }

  if (!notification_preferences) {
    return reply.status(400).send({
      message: 'notification_preferences is required',
    })
  }

  try {
    const user = await User.findById(userId)
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    // Find or create preferences
    let preferences = await UserPreferences.findOne({ user: userId })

    if (!preferences) {
      preferences = new UserPreferences({
        user: userId,
        notification_preferences: {
          new_creation: true,
          new_message: true,
          session_permissions: true,
          agent_permissions: true,
        },
      })
    }

    // Update notification preferences
    if (!preferences.notification_preferences) {
      preferences.notification_preferences = {
        new_creation: true,
        new_message: true,
        session_permissions: true,
        agent_permissions: true,
      }
    }

    if (notification_preferences.new_creation !== undefined) {
      preferences.notification_preferences.new_creation =
        notification_preferences.new_creation
    }
    if (notification_preferences.new_message !== undefined) {
      preferences.notification_preferences.new_message =
        notification_preferences.new_message
    }
    if (notification_preferences.session_permissions !== undefined) {
      preferences.notification_preferences.session_permissions =
        notification_preferences.session_permissions
    }
    if (notification_preferences.agent_permissions !== undefined) {
      preferences.notification_preferences.agent_permissions =
        notification_preferences.agent_permissions
    }

    await preferences.save()

    return reply.status(200).send({
      notification_preferences: preferences.notification_preferences,
      message: 'Notification preferences updated successfully',
    })
  } catch (e) {
    console.error('Error updating notification preferences:', e)
    return reply.status(500).send({
      message: 'Failed to update notification preferences',
    })
  }
}

export const updatePlatformFilters = async (
  _server: FastifyInstance,
  request: FastifyRequest<{ Body: { platforms: string[] } }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  const { platforms } = request.body

  if (!userId) {
    return reply.status(401).send({
      message: 'Unauthorized',
    })
  }

  if (!platforms || !Array.isArray(platforms)) {
    return reply.status(400).send({
      message: 'platforms must be an array',
    })
  }

  // Validate all platforms are valid
  const invalidPlatforms = platforms.filter(
    p => !VALID_PLATFORMS.includes(p as SessionPlatformFilter),
  )
  if (invalidPlatforms.length > 0) {
    return reply.status(400).send({
      message: `Invalid platforms: ${invalidPlatforms.join(
        ', ',
      )}. Valid platforms are: ${VALID_PLATFORMS.join(', ')}`,
    })
  }

  try {
    const user = await User.findById(userId)
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    const updatedPrefs = await UserPreferences.updatePlatformFilters(
      userId,
      platforms as SessionPlatformFilter[],
    )

    return reply.status(200).send({
      session_platform_filters: updatedPrefs.session_platform_filters,
      message: 'Platform filters updated successfully',
    })
  } catch (e) {
    console.error('Error updating platform filters:', e)
    return reply.status(500).send({
      message: 'Failed to update platform filters',
    })
  }
}
