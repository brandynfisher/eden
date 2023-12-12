import { Clerk } from '@clerk/backend'
import { clerkPlugin, createClerkClient, getAuth } from '@clerk/fastify'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { User } from '../models/Creator'

export const registerClerk = async (fastify: FastifyInstance) => {
  try {
    const clerkOptions = {
      publishableKey: fastify.config.CLERK_PUBLISHABLE_KEY,
      secretKey: fastify.config.CLERK_SECRET_KEY,
    }

    const clerkClient = createClerkClient(clerkOptions)
    fastify.register(clerkPlugin, clerkOptions)
    fastify.decorate('clerk', clerkClient)
    fastify.decorate(
      'verifyUser',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = getAuth(request)
        if (!userId) {
          // return reply.status(401).send({
          //   error: 'Unauthorized',
          //   message: 'Invalid session',
          // })
          throw new Error('Invalid session')
        }

        const user = await User.findOne({
          userId,
        })

        if (!user) {
          // return reply.status(401).send({
          //   error: 'Unauthorized',
          //   message: 'User not found',
          // })
          throw new Error('User not found')
        }

        request.user = {
          userId: user._id,
          subscriptionTier: user.subscriptionTier || SubscriptionTier.Free,
          featureFlags: user.featureFlags || [],
          isAdmin: user.isAdmin || false,
        }
      },
    )
    fastify.log.info('Successfully registered ClerkPlugin')
  } catch (err) {
    fastify.log.error('Plugin: Clerk, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    clerk?: typeof Clerk
  }
}

export default registerClerk
