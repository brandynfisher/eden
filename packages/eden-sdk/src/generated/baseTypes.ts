import { TSchema, Type } from '@sinclair/typebox'

// Pagination helpers
export const paginatedResponse = <T extends TSchema>(docs: T) => {
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

export const cursorPaginatedResponse = <T extends TSchema>(docs: T) => {
  return Type.Object({
    docs: Type.Array(docs),
    nextCursor: Type.Optional(Type.Any()),
  })
}
