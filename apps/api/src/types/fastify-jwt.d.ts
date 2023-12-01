import '@fastify/jwt'
import { ObjectId } from 'mongodb'

import { CharacterDocument } from '../models/Character'
import { SubscriptionTier } from '../models/Creator'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; isAdmin: boolean }
    user: {
      userId: ObjectId
      character?: CharacterDocument
      featureFlags: string[]
      subscriptionTier: SubscriptionTier
      isAdmin: boolean
    }
  }
}
