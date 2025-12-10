import { Agent } from '../models/Agent'
import { DeviceToken } from '../models/DeviceToken'
import { Notification, NotificationType } from '../models/Notification'
import { Trigger } from '../models/Trigger'
import { User } from '../models/User'
import { UserPreferences } from '../models/UserPreferences'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import { sendPushNotification } from '../services/pushNotificationService'
import {
  NotificationsArchiveArguments,
  NotificationsCountArguments,
  NotificationsCreateArguments,
  NotificationsListArguments,
  NotificationsMarkReadArguments,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const createNotification = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const {
    user_id,
    type,
    title,
    message,
    priority = 'normal',
    channels = ['in_app'],
    trigger_id,
    session_id,
    agent_id,
    metadata,
    action_url,
    expires_at,
  } = request.body as NotificationsCreateArguments

  // Verify user exists
  const user = await User.findById(user_id)
  if (!user) {
    return reply.status(404).send({
      error: 'User not found',
    })
  }

  // Verify related entities exist if provided
  if (trigger_id) {
    const trigger = await Trigger.findById(trigger_id)
    if (!trigger) {
      return reply.status(404).send({
        error: 'Trigger not found',
      })
    }
  }

  if (agent_id) {
    const agent = await Agent.findById(agent_id)
    if (!agent) {
      return reply.status(404).send({
        error: 'Agent not found',
      })
    }
  }

  try {
    const notification = new Notification({
      user: user_id,
      type,
      title,
      message,
      priority,
      channels,
      trigger: trigger_id || undefined,
      session: session_id || undefined,
      agent: agent_id || undefined,
      metadata,
      action_url,
      expires_at,
    })

    await notification.save()

    // Mark as delivered for in-app channel immediately
    if (channels.includes('in_app')) {
      notification.delivered_channels.push('in_app')
      await notification.save()
    }

    // Send push notifications if 'push' is in channels
    if (channels.includes('push')) {
      try {
        // Check user's notification preferences
        const userPreferences = await UserPreferences.findOne({
          user: user_id,
        }).lean()

        // Default preferences (all enabled)
        const defaultPreferences = {
          new_creation: true,
          new_message: true,
          session_permissions: true,
          agent_permissions: true,
        }

        const notificationPrefs =
          userPreferences?.notification_preferences || defaultPreferences

        // Map notification type to preference category
        // Cast to NotificationType to include all possible types from the model
        const notificationType = type as NotificationType
        let shouldSendPush = true
        if (
          notificationType === 'trigger_complete' ||
          notificationType === 'trigger_started' ||
          notificationType === 'trigger_failed'
        ) {
          shouldSendPush = notificationPrefs.new_creation
        } else if (notificationType === 'session_message') {
          shouldSendPush = notificationPrefs.new_message
        } else if (
          notificationType === 'session_permission_added' ||
          notificationType === 'session_permission_removed'
        ) {
          shouldSendPush = notificationPrefs.session_permissions
        } else if (
          notificationType === 'agent_permission_added' ||
          notificationType === 'agent_permission_removed'
        ) {
          shouldSendPush = notificationPrefs.agent_permissions
        }
        // For other types (system_alert, agent_mentioned, etc.), always send if push is enabled

        if (shouldSendPush) {
          // Get user's device tokens
          const deviceTokens = await DeviceToken.find({
            user: user_id,
            active: true,
          })

          if (deviceTokens.length > 0) {
            const pushPromises = deviceTokens.map(token =>
              sendPushNotification(server, token.push_token, title, message, {
                notification_id: notification._id.toString(),
                type,
                session_id,
                ...metadata,
              }),
            )

            const results = await Promise.allSettled(pushPromises)

            // Check results and update delivered_channels
            const successful = results.filter(
              r => r.status === 'fulfilled' && r.value.success,
            )
            if (successful.length > 0) {
              notification.delivered_channels.push('push')
            }

            // Mark failed tokens as inactive if needed
            results.forEach((result, index) => {
              if (
                result.status === 'rejected' ||
                (result.status === 'fulfilled' && !result.value.success)
              ) {
                server.log.warn(
                  `Failed to send push to token ${deviceTokens[index].push_token}`,
                )
              }
            })
          }
        } else {
          server.log.info(
            `[NOTIFICATIONS] Push notification skipped for user ${user_id} due to preferences (type: ${type})`,
          )
        }

        notification.delivery_attempted_at = new Date()
        await notification.save()
      } catch (pushError) {
        server.log.error(
          { err: pushError },
          '[NOTIFICATIONS] Failed to send push notifications',
        )
        notification.delivery_failed_channels.push('push')
        await notification.save()
      }
    }

    // Broadcast WebSocket event for new notification
    try {
      if (server.internalMessages && session_id) {
        server.internalMessages.publish('notifications', {
          event: 'notification-created',
          data: {
            session_id,
            user_id,
            notification_id: notification._id.toString(),
            type,
          },
        })
      }
    } catch (broadcastError) {
      request.log.error(
        { err: broadcastError },
        '[NOTIFICATIONS] Failed to broadcast notification-created event:',
      )
      // Don't fail the request if broadcast fails
    }

    return reply.status(200).send({
      id: notification._id.toString(),
      message: 'Notification created successfully',
    })
  } catch (error) {
    request.log.error(
      { err: error },
      '[NOTIFICATIONS] ❌ Error creating notification:',
    )
    // Log the full error details
    if (error instanceof Error) {
      request.log.error(`[NOTIFICATIONS] Error message: ${error.message}`)
      request.log.error(`[NOTIFICATIONS] Error stack: ${error.stack}`)
    }
    return reply.status(500).send({
      error: 'An error occurred while creating the notification',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

export const getNotifications = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const {
    read,
    type,
    priority,
    trigger_id,
    session_id,
    limit = 50,
    offset = 0,
    include_archived = false,
  } = request.query as NotificationsListArguments

  try {
    // Build query filter
    const query: any = { user: currentUserId }

    if (!include_archived) {
      query.archived = { $ne: true }
    }

    if (read !== undefined) {
      query.read = read
    }

    if (type) {
      query.type = type
    }

    if (priority) {
      query.priority = priority
    }

    if (trigger_id) {
      query.trigger = trigger_id
    }

    if (session_id) {
      query.session = session_id
    }

    // Get total count
    const total_count = await Notification.countDocuments(query)

    // Get unread count
    const unread_query = { ...query, read: false }
    const unread_count = await Notification.countDocuments(unread_query)

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate({
        path: 'user',
        select: '_id userId username userImage',
      })
      .populate({
        path: 'agent',
        select: '_id name username userImage',
      })
      .populate({
        path: 'trigger',
        select: '_id trigger_id instruction',
      })
      .lean()

    // Process notifications for response - transform to match SDK types
    const processedNotifications = notifications.map((notification: any) => {
      // Handle populated user
      let userResponse = notification.user
      if (notification.user && typeof notification.user === 'object') {
        if (notification.user.userImage) {
          notification.user.userImage = forceCloudfrontUrl(
            server,
            notification.user.userImage,
          )
        }
        userResponse = notification.user
      } else {
        userResponse = notification.user.toString()
      }

      // Handle populated agent
      let agentResponse = null
      if (notification.agent) {
        if (typeof notification.agent === 'object') {
          if (notification.agent.userImage) {
            notification.agent.userImage = forceCloudfrontUrl(
              server,
              notification.agent.userImage,
            )
          }
          agentResponse = notification.agent
        } else {
          agentResponse = notification.agent.toString()
        }
      }

      // Handle populated trigger
      let triggerResponse = null
      if (notification.trigger) {
        triggerResponse =
          typeof notification.trigger === 'object'
            ? notification.trigger._id.toString()
            : notification.trigger.toString()
      }

      return {
        _id: notification._id.toString(),
        user: userResponse,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        read_at: notification.read_at,
        priority: notification.priority,
        trigger: triggerResponse,
        session: notification.session ? notification.session.toString() : null,
        agent: agentResponse,
        channels: notification.channels,
        delivered_channels: notification.delivered_channels,
        delivery_attempted_at: notification.delivery_attempted_at,
        delivery_failed_channels: notification.delivery_failed_channels,
        metadata: notification.metadata,
        action_url: notification.action_url,
        expires_at: notification.expires_at,
        archived: notification.archived,
        archived_at: notification.archived_at,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      }
    })

    return reply.status(200).send({
      notifications: processedNotifications,
      total_count,
      unread_count,
    })
  } catch (error) {
    console.error('Error getting notifications:', error)
    return reply.status(500).send({
      error: 'Failed to get notifications',
    })
  }
}

export const markNotificationsRead = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { notification_ids } = request.body as NotificationsMarkReadArguments

  try {
    // Build query
    const query: any = { user: currentUserId, read: false }

    if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      query._id = { $in: notification_ids }
    }

    // Update notifications
    const updateResult = await Notification.updateMany(query, {
      $set: {
        read: true,
        read_at: new Date(),
      },
    })

    return reply.status(200).send({
      marked_read_count: updateResult.modifiedCount || 0,
      message: `Marked ${
        updateResult.modifiedCount || 0
      } notifications as read`,
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return reply.status(500).send({
      error: 'Failed to mark notifications as read',
    })
  }
}

export const getNotificationCount = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { read = false } = request.query as NotificationsCountArguments

  try {
    // Build query
    const query: any = { user: currentUserId, archived: { $ne: true } }

    if (read !== undefined) {
      query.read = read
    }

    const count = await Notification.countDocuments(query)

    return reply.status(200).send({
      count,
    })
  } catch (error) {
    console.error('Error getting notification count:', error)
    return reply.status(500).send({
      error: 'Failed to get notification count',
    })
  }
}

export const archiveNotifications = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { notification_ids } = request.body as NotificationsArchiveArguments

  if (!notification_ids || notification_ids.length === 0) {
    return reply.status(400).send({
      error: 'notification_ids is required and must not be empty',
    })
  }

  try {
    // Update notifications (soft delete by archiving)
    const updateResult = await Notification.updateMany(
      {
        _id: { $in: notification_ids },
        user: currentUserId, // Ensure user owns these notifications
      },
      {
        $set: {
          archived: true,
          archived_at: new Date(),
        },
      },
    )

    return reply.status(200).send({
      archived_count: updateResult.modifiedCount || 0,
      message: `Archived ${updateResult.modifiedCount || 0} notifications`,
    })
  } catch (error) {
    console.error('Error archiving notifications:', error)
    return reply.status(500).send({
      error: 'Failed to archive notifications',
    })
  }
}

export const markSessionNotificationsRead = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { session_id } = request.params as { session_id: string }

  try {
    // Mark all unread session_message notifications for this session as read
    const updateResult = await Notification.updateMany(
      {
        user: currentUserId,
        session: session_id,
        type: 'session_message',
        read: false,
      },
      {
        $set: {
          read: true,
          read_at: new Date(),
        },
      },
    )

    // Broadcast update via WebSocket (non-blocking)
    if (updateResult.modifiedCount > 0) {
      try {
        if (server.internalMessages) {
          server.internalMessages.publish('notifications', {
            event: 'notification-cleared',
            data: { session_id, user_id: currentUserId },
          })
        }
      } catch (broadcastError) {
        server.log.error(
          { err: broadcastError },
          '[NOTIFICATIONS] Failed to broadcast WebSocket event:',
        )
        // Don't fail the request if broadcast fails
      }
    }

    return reply.status(200).send({
      success: true,
      marked_count: updateResult.modifiedCount || 0,
      message: `Marked ${
        updateResult.modifiedCount || 0
      } session notifications as read`,
    })
  } catch (error) {
    server.log.error(
      { err: error },
      '[NOTIFICATIONS] ❌ Error marking session notifications as read:',
    )
    return reply.status(500).send({
      error: 'Failed to mark session notifications as read',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

export const registerPushToken = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user.userId
  const { push_token, platform, device_id } = request.body as {
    push_token: string
    platform: 'ios' | 'android' | 'web'
    device_id?: string
  }

  try {
    // Check if token already exists
    const existingToken = await DeviceToken.findOne({ push_token })

    if (existingToken) {
      // Update existing token (user might have logged in on different account)
      existingToken.user = userId
      existingToken.platform = platform
      existingToken.device_id = device_id
      existingToken.active = true
      await existingToken.save()

      return reply.status(200).send({
        success: true,
        message: 'Push token updated successfully',
      })
    } else {
      // Create new token
      const deviceToken = new DeviceToken({
        user: userId,
        push_token,
        platform,
        device_id,
        active: true,
      })
      await deviceToken.save()

      return reply.status(200).send({
        success: true,
        message: 'Push token registered successfully',
      })
    }
  } catch (error) {
    request.log.error({ err: error }, 'Error registering push token')
    return reply.status(500).send({
      success: false,
      error: 'Failed to register push token',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
