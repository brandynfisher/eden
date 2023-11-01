import '@fastify/jwt'
import { ObjectId } from 'mongodb'

import { SubscriptionTier } from '../models/Creator'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; isAdmin: boolean }
    user: {
      userId: ObjectId
      featureFlags: string[]
      subscriptionTier: SubscriptionTier
      isAdmin: boolean
    }
  }
}
