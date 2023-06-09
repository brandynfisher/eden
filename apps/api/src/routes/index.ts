import { TSchema, Type } from '@sinclair/typebox'

import adminRoutes from './adminRoutes'
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

export const listQuery = (schema: TSchema) => {
  const querySchema = Type.Object({
    page: Type.Optional(Type.Number()),
    limit: Type.Optional(Type.Number()),
    sort: Type.Optional(Type.String()),
  })

  const x = Type.Union([querySchema, schema])
  console.log(x)
  return x
}

export const routes = [
  adminRoutes,
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
