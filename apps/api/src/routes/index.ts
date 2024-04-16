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
import sessionRoutes from './sessionRoutes'
import taskRoutes from './taskRoutes'
import { TSchema, Type } from '@sinclair/typebox'

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

const basePaginationProperties = {
  orderBy: { type: 'string' },
  direction: { type: 'number' },
  limit: { type: 'number' },
}

export const paginationProperties = () => {
  return {
    page: { type: 'number' },
    ...basePaginationProperties,
  }
}

export const cursorPaginationProperties = () => {
  return {
    cursor: Type.Optional(Type.String()),
    nextValue: Type.Optional(Type.Number()),
    sort: { type: ['string', 'array'] },
    limit: { type: 'number' },
    filter: { type: ['string', 'array'] },
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
  feedRoutes,
  sessionRoutes,
  paymentRoutes,
]
