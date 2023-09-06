import { Clerk } from '@clerk/backend'
import { clerkPlugin, createClerkClient, getAuth } from '@clerk/fastify'
import type { FastifyInstance } from 'fastify'

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
    fastify.decorate('verifyUser', async (request: any) => {
      const { userId } = getAuth(request)
      if (!userId) {
        console.log(request.headers)
        throw new Error('Clerk: Not authorized')
      }

      const user = await User.findOne({
        userId,
      })

      if (!user) {
        throw new Error('Clerk: User not found')
      }

      request.user = {
        userId: user._id,
        isAdmin: user.isAdmin || false,
      }
    })
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
