import { DeviceToken } from '../models/DeviceToken'
import { Notification } from '../models/Notification'
import { SessionDocument } from '../models/v2/SessionV2'
import { TaskV2Document } from '../models/v2/TaskV2'
import { ThreadDocument } from '../models/v2/Thread'
import { sendPushNotification } from '../services/pushNotificationService'
import { Message, TaskV2Status, ThreadMessage } from '@edenlabs/eden-sdk'
import { FastifyInstance } from 'fastify'

type GenericUpdate = { [key: string]: string | number | boolean }

// updated fields are a flat structure that uses dot notation for sub documents, e.g. { 'task.output.files.0': 'http://12312312' }
export const handleTaskUpdateStreamEvent = async (
  server: FastifyInstance,
  task: TaskV2Document,
  _updatedFields?: GenericUpdate,
) => {
  server.internalMessages.publish('task-updates-v2', task)

  if (task.status === TaskV2Status.Completed) {
    await sendTaskCompletionNotification(server, task)
  }
}

const extractFirstCreationId = (task: TaskV2Document) => {
  if (!task?.result) return null
  for (const res of task.result) {
    if (!res?.output) continue
    if (Array.isArray(res.output)) {
      for (const out of res.output) {
        const creationId = (out as any)?.creation?._id || (out as any)?.creation
        if (creationId) return creationId.toString()
      }
    }
  }
  return null
}

const sendTaskCompletionNotification = async (
  server: FastifyInstance,
  task: TaskV2Document,
) => {
  if (!task?.user) return

  const creationId = extractFirstCreationId(task)
  const title = 'Your creation is ready'
  const message = task.tool
    ? `${task.tool} task finished`
    : 'A task you started has finished'

  const notification = new Notification({
    user: task.user,
    type: 'session_complete',
    title,
    message,
    priority: 'normal',
    action_url: creationId ? `/creations/${creationId}` : undefined,
    metadata: {
      task_id: task._id?.toString(),
      creation_id: creationId,
    },
    channels: ['in_app', 'push'],
    delivered_channels: [],
  })

  notification.delivered_channels.push('in_app')

  await notification.save()

  try {
    const deviceTokens = await DeviceToken.find({
      user: task.user,
      active: true,
    })

    if (deviceTokens.length) {
      const results = await Promise.allSettled(
        deviceTokens.map(token =>
          sendPushNotification(server, token.push_token, title, message, {
            notification_id: notification._id.toString(),
            type: 'session_complete',
            task_id: task._id?.toString(),
            creation_id: creationId,
            action_url: creationId ? `/creations/${creationId}` : undefined,
          }),
        ),
      )

      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value?.success,
      )
      if (successful.length) {
        notification.delivered_channels.push('push')
      }

      results.forEach((result, index) => {
        const token = deviceTokens[index]
        if (
          result.status === 'fulfilled' &&
          result.value?.error === 'Invalid push token'
        ) {
          token.active = false
          token.save().catch(() => null)
        }
      })
    }
  } catch (error) {
    server.log.error(
      { err: error },
      '[NOTIFICATIONS] Failed sending task completion push',
    )
    notification.delivery_failed_channels.push('push')
  }

  await notification.save()
}

export const handleThreadUpdateStreamEvent = async (
  server: FastifyInstance,
  thread?: ThreadDocument,
  newMessages?: ThreadMessage[],
) => {
  server.internalMessages.publish('thread-updates', { thread, newMessages })
}

export const handleSessionUpdateStreamEvent = async (
  server: FastifyInstance,
  session?: SessionDocument,
  newMessages?: Message[],
) => {
  server.internalMessages.publish('session-updates', { session, newMessages })
}

export const calculateMaxDimensions = (
  aspectRatio: number,
  maxDimension: number,
): {
  width: number
  height: number
} => {
  let width, height
  if (aspectRatio > 1) {
    width = maxDimension
    height = Math.round(maxDimension / aspectRatio)
  } else {
    width = Math.round(maxDimension * aspectRatio)
    height = maxDimension
  }
  return { width, height }
}
