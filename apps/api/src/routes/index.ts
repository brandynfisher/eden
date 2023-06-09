import { TSchema, Type } from '@sinclair/typebox'

import adminRoutes from './adminRoutes'
import agentRoutes from './agentRoutes'
import apiKeyRoutes from './apiKeyRoutes'
import authRoutes from './authRoutes'
import characterRoutes from './characterRoutes'
import collectionRoutes from './collectionRoutes'
import creationRoutes from './creationRoutes'
import creatorRoutes from './creatorRoutes'
import generatorRoutes from './generatorRoutes'
import loraRoutes from './loraRoutes'
import mannaRoutes from './mannaRoutes'
import mediaRoutes from './mediaRoutes'
import mintRoutes from './mintRoutes'
import taskRoutes from './taskRoutes'
import userRoutes from './userRoutes'

export const paginatedResponse = (docs: TSchema) => {
  return Type.Object({
    docs: Type.Array(docs),
    total: Type.Number(),
    limit: Type.Number(),
    pages: Type.Number(),
    page: Type.Number(),
    pagingCounter: Type.Number(),
    hasPrevPage: Type.Boolean(),
    hasNextPage: Type.Boolean(),
    prevPage: Type.Optional(Type.Number()),
    nextPage: Type.Optional(Type.Number()),
  })
}

export const paginationProperties = () => {
  return {
    page: { type: 'number' },
    limit: { type: 'number' },
    sort: { type: 'string' },
  }
}

export const routes = [
  adminRoutes,
  agentRoutes,
  authRoutes,
  mannaRoutes,
  apiKeyRoutes,
  mediaRoutes,
  userRoutes,
  creatorRoutes,
  creationRoutes,
  collectionRoutes,
  mintRoutes,
  loraRoutes,
  characterRoutes,
  generatorRoutes,
  taskRoutes,
]
