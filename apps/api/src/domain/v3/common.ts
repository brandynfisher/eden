import { type TSchema, Type } from '@sinclair/typebox'

export const ErrorResponseSchema = Type.Object({
  message: Type.String(),
})

export const MessageResponseSchema = Type.Object({
  message: Type.String(),
})

export const NullableStringSchema = Type.String({ nullable: true })
export const NullableNumberSchema = Type.Number({ nullable: true })

export const paginatedResponseSchema = (docs: TSchema) =>
  Type.Object({
    docs: Type.Array(docs),
    total: Type.Number(),
    limit: Type.Number(),
    pages: Type.Number(),
    page: Type.Number(),
    pagingCounter: Type.Number(),
    hasPrevPage: Type.Boolean(),
    hasNextPage: Type.Boolean(),
    prevPage: Type.Optional(NullableNumberSchema),
    nextPage: Type.Optional(NullableNumberSchema),
  })
