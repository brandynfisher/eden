import { Clerk } from '@clerk/backend'
import { clerkPlugin, createClerkClient } from '@clerk/fastify'
import type { FastifyInstance } from 'fastify'

export const registerClerk = async (fastify: FastifyInstance) => {
  try {
    const clerkOptions = {
      publishableKey: fastify.config.CLERK_PUBLISHABLE_KEY,
      secretKey: fastify.config.CLERK_SECRET_KEY,
    }

    const clerkClient = createClerkClient(clerkOptions)
    fastify.register(clerkPlugin, clerkOptions)
    fastify.decorate('clerk', clerkClient)
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
