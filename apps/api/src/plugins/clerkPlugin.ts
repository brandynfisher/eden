import { isAllowedAccess } from '../lib/authorization'
import { User } from '../models/User'
import { clerkPlugin, createClerkClient, getAuth } from '@clerk/fastify'
import { clerkClient } from '@clerk/fastify/dist/types/clerkClient'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import type { FastifyInstance, FastifyRequest } from 'fastify'

export const registerClerk = async (fastify: FastifyInstance) => {
  try {
    const clerkOptions = {
      publishableKey: fastify.config.CLERK_PUBLISHABLE_KEY,
      secretKey: fastify.config.CLERK_SECRET_KEY,
    }

    const clerkClient = createClerkClient(clerkOptions)
    fastify.register(clerkPlugin, clerkOptions)
    fastify.decorate('clerk', clerkClient)
    fastify.decorate('verifyUser', async (request: FastifyRequest) => {
      const { userId } = getAuth(request)
      if (!userId) {
        throw new Error('Invalid session')
      }

      const user = await User.findOne({
        userId,
      })

      if (!user) {
        // The user row is created only by the Clerk `user.created` webhook, but
        // the frontend treats the user as signed in the moment Clerk finishes.
        // Every call in that gap 401s and nothing on the client retries, so a
        // fresh signup who acts immediately — redeeming a voucher, claiming the
        // daily bonus — silently loses the action. Name the race so the message
        // is actionable instead of reading like a dead account.
        throw new Error(
          'Account is still being provisioned, please retry in a moment',
        )
      }

      if (!isAllowedAccess(fastify, userId)) {
        throw new Error('User not allowed')
      }

      request.user = {
        userId: user._id,
        subscriptionTier: user.subscriptionTier || SubscriptionTier.Free,
        highestMonthlySubscriptionTier:
          user.highestMonthlySubscriptionTier || SubscriptionTier.Free,
        featureFlags: user.featureFlags || [],
        isAdmin: user.isAdmin || false,
      }
    })
    fastify.log.info('Successfully registered plugin: Clerk')
  } catch (err) {
    fastify.log.error({ err }, 'Plugin: Clerk, error on register')
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    clerk?: typeof clerkClient
  }
}

export default registerClerk
