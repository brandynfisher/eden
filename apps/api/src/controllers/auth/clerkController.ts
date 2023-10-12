import { WebhookEvent } from '@clerk/clerk-sdk-node'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { IncomingHttpHeaders } from 'http'
import { Webhook, WebhookRequiredHeaders } from 'svix'

import { User, UserDocument } from '../../models/Creator'
import { createNewUser } from './authController'

export const receiveUserUpdate = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!server.config.CLERK_WEBHOOK_SECRET) {
    return reply.status(400).send('Webhook Error: Missing webhook secret')
  }
  const wh = new Webhook(server.config.CLERK_WEBHOOK_SECRET)
  const payload = JSON.stringify(request.body)
  const headers = request.headers as IncomingHttpHeaders &
    WebhookRequiredHeaders

  let evt: WebhookEvent
  try {
    evt = wh.verify(payload, headers) as WebhookEvent
  } catch (err) {
    return reply.status(400).send('Webhook Error: Invalid signing secret')
  }
  const eventType = evt.type

  let user: UserDocument | null
  switch (eventType) {
    case 'user.created':
      if (!evt.data.username) {
        return reply.status(400).send('Webhook Error: Missing username')
      }
      await createNewUser({
        userId: evt.data.id,
        username: evt.data.username,
        userImage: evt.data.image_url,
        isWeb2: false,
        isClerk: true,
        isAdmin: false,
      })
      return reply.status(200).send({})
    case 'user.updated':
      user = await User.findOne({
        userId: evt.data.id,
      })
      if (!user) {
        return reply.status(400).send('Webhook Error: User not found')
      }
      user.username = evt.data.username || user.username
      user.userImage = evt.data.image_url || user.userImage
      await user.save()
      return reply.status(200).send({})
    case 'user.deleted':
      user = await User.findOne({
        userId: evt.data.id,
      })
      if (!user) {
        return reply.status(400).send('Webhook Error: User not found')
      }
      user.deleted = true
      await user.save()
      return reply.status(200).send({})
    default:
      return reply.status(400).send('Webhook Error: Invalid event type')
  }
}
