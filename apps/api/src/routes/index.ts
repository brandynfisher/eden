import { TSchema, Type } from '@sinclair/typebox'

import adminRoutes from './adminRoutes'
import apiKeyRoutes from './apiKeyRoutes'
import authRoutes from './authRoutes'
import characterRoutes from './characterRoutes'
import collectionRoutes from './collectionRoutes'
import conceptRoutes from './conceptRoutes'
import creationRoutes from './creationRoutes'
import creatorRoutes from './creatorRoutes'
import feedRoutes from './feedRoutes'
import generatorRoutes from './generatorRoutes'
import mannaRoutes from './mannaRoutes'
import mediaRoutes from './mediaRoutes'
import paymentRoutes from './paymentRoutes'
import scenarioRoutes from './scenarioRoutes'
import sessionRoutes from './sessionRoutes'
import taskRoutes from './taskRoutes'
import uploadRoutes from './uploadRoutes'

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
    orderBy: { type: 'string' },
    direction: { type: 'number' },
  }
}

export const routes = [
  adminRoutes,
  characterRoutes,
  authRoutes,
  mannaRoutes,
  apiKeyRoutes,
  mediaRoutes,
  creatorRoutes,
  creationRoutes,
  collectionRoutes,
  generatorRoutes,
  conceptRoutes,
  taskRoutes,
  scenarioRoutes,
  feedRoutes,
  sessionRoutes,
  paymentRoutes,
  uploadRoutes,
]
