import { paginatedResponse } from './baseTypes'
import { Type } from '@sinclair/typebox'

// ApiKeysListArguments - Query
export const ApiKeysListQuerySchema = Type.Object({
  page: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number()),
  sort: Type.Optional(Type.Any()),
})

// ApiKeysCreateArguments - Body
export const ApiKeysCreateBodySchema = Type.Object({
  note: Type.Optional(Type.String()),
})

// ApiKeysDeleteArguments - Body
export const ApiKeysDeleteBodySchema = Type.Object({
  apiKey: Type.String(),
})

// ApiKey - List Item
export const ApiKeyListItemSchema = Type.Object({
  apiKey: Type.String(),
  note: Type.String(),
  createdAt: Type.String(),
})

// ApiKeysCreateResponse
export const ApiKeysCreateResponseSchema = {
  200: Type.Object({
    apiKey: Type.Optional(
      Type.Object({
        apiKey: Type.Optional(Type.String()),
        apiSecret: Type.Optional(Type.String()),
      }),
    ),
  }),
}

// ApiKeysDeleteResponse
export const ApiKeysDeleteResponseSchema = {
  200: Type.Object({}),
}

// ApiKeysListResponse
export const ApiKeysListResponseSchema = {
  200: paginatedResponse(ApiKeyListItemSchema),
}

// PaginatedResponse
export const PaginatedResponseSchema = {
  200: paginatedResponse(ApiKeyListItemSchema),
}

// PaginatedCursorResponse
export const PaginatedCursorResponseSchema = {
  200: paginatedResponse(ApiKeyListItemSchema),
}
