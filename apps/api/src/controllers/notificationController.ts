import { Agent } from '../models/Agent'
import { Notification, NotificationDocument } from '../models/Notification'
import { Trigger } from '../models/Trigger'
import { User } from '../models/User'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import {
  NotificationsArchiveArguments,
  NotificationsArchiveResponse,
  NotificationsCountArguments,
  NotificationsCountResponse,
  NotificationsCreateArguments,
  NotificationsCreateResponse,
  NotificationsListArguments,
  NotificationsListResponse,
  NotificationsMarkReadArguments,
  NotificationsMarkReadResponse,
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

    const response: NotificationsCreateResponse = {
      id: notification._id.toString(),
      message: 'Notification created successfully',
    }

    return reply.status(200).send(response)
  } catch (error) {
    console.error('Error creating notification:', error)
    return reply.status(500).send({
      error: 'An error occurred while creating the notification',
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

    // Process notifications for response
    const processedNotifications = notifications.map(notification => {
      // Force cloudfront URLs for images
      if (notification.user?.userImage) {
        notification.user.userImage = forceCloudfrontUrl(
          server,
          notification.user.userImage,
        )
      }
      if (notification.agent?.userImage) {
        notification.agent.userImage = forceCloudfrontUrl(
          server,
          notification.agent.userImage,
        )
      }

      return {
        ...notification,
        _id: notification._id.toString(),
        user: notification.user?._id?.toString(),
        trigger: notification.trigger?._id?.toString() || null,
        session: notification.session?.toString() || null,
        agent: notification.agent?._id?.toString() || null,
      }
    })

    const response: NotificationsListResponse = {
      notifications: processedNotifications as any,
      total_count,
      unread_count,
    }

    return reply.status(200).send(response)
  } catch (error) {
    console.error('Error getting notifications:', error)
    return reply.status(500).send({
      error: 'Failed to get notifications',
    })
  }
}

export const markNotificationsRead = async (
  server: FastifyInstance,
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

    const response: NotificationsMarkReadResponse = {
      marked_read_count: updateResult.modifiedCount || 0,
      message: `Marked ${
        updateResult.modifiedCount || 0
      } notifications as read`,
    }

    return reply.status(200).send(response)
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return reply.status(500).send({
      error: 'Failed to mark notifications as read',
    })
  }
}

export const getNotificationCount = async (
  server: FastifyInstance,
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

    const response: NotificationsCountResponse = {
      count,
    }

    return reply.status(200).send(response)
  } catch (error) {
    console.error('Error getting notification count:', error)
    return reply.status(500).send({
      error: 'Failed to get notification count',
    })
  }
}

export const archiveNotifications = async (
  server: FastifyInstance,
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

    const response: NotificationsArchiveResponse = {
      archived_count: updateResult.modifiedCount || 0,
      message: `Archived ${updateResult.modifiedCount || 0} notifications`,
    }

    return reply.status(200).send(response)
  } catch (error) {
    console.error('Error archiving notifications:', error)
    return reply.status(500).send({
      error: 'Failed to archive notifications',
    })
  }
}
