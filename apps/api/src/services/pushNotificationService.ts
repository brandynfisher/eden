import { Expo, ExpoPushMessage } from 'expo-server-sdk'
import { FastifyInstance } from 'fastify'

const expo = new Expo()

export async function sendPushNotification(
  server: FastifyInstance,
  pushToken: string,
  title: string,
  message: string,
  data?: any,
  options?: {
    imageUrl?: string
  },
) {
  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(pushToken)) {
    server.log.warn(`Push token ${pushToken} is not a valid Expo push token`)
    return { success: false, error: 'Invalid push token' }
  }

  type ExpoPushMessageWithRichContent = ExpoPushMessage & {
    richContent?: { image: string }
    mutableContent?: boolean
  }

  const payloadData = { ...(data || {}) }
  if (options?.imageUrl) {
    payloadData.image = options.imageUrl
  }

  const notificationMessage: ExpoPushMessageWithRichContent = {
    to: pushToken,
    sound: 'default',
    title,
    body: message,
    data: payloadData,
    priority: 'default',
  }

  if (options?.imageUrl) {
    notificationMessage.richContent = { image: options.imageUrl }
    notificationMessage.mutableContent = true
  }

  const messages: ExpoPushMessage[] = [notificationMessage]

  try {
    const chunks = expo.chunkPushNotifications(messages)
    const tickets = []

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
        tickets.push(...ticketChunk)
      } catch (error) {
        server.log.error(
          { err: error },
          'Error sending push notification chunk',
        )
      }
    }

    // Check ticket status
    const receiptIds = []
    for (const ticket of tickets) {
      if (ticket.status === 'ok') {
        receiptIds.push(ticket.id)
      } else {
        server.log.error(`Error sending push notification: ${ticket.message}`)
      }
    }

    return { success: true, tickets, receiptIds }
  } catch (error) {
    server.log.error({ err: error }, 'Error sending push notification')
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
