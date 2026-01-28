import {
  ErrorResponseSchema,
  MessageResponseSchema,
  NullableStringSchema,
  paginatedResponseSchema,
} from './common'
import { Type } from '@sinclair/typebox'

export const ArtifactIdParamSchema = Type.Object({
  artifactId: Type.String(),
})

export const ArtifactsListQuerySchema = Type.Object({
  ownerId: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  sessionId: Type.Optional(Type.String()),
  page: Type.Optional(Type.Integer()),
  limit: Type.Optional(Type.Integer()),
  orderBy: Type.Optional(Type.String()),
  direction: Type.Optional(Type.Integer()),
})

export const ArtifactsHistoryQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer()),
  limit: Type.Optional(Type.Integer()),
  orderBy: Type.Optional(Type.String()),
  direction: Type.Optional(Type.Integer()),
})

export const ArtifactSchema = Type.Object(
  {
    _id: Type.String(),
    owner: Type.String(),
    title: Type.String(),
    type: Type.String(),
    public: Type.Boolean(),
    session: Type.Optional(NullableStringSchema),
    originSession: Type.Optional(NullableStringSchema),
    version: Type.Integer(),
    deleted: Type.Optional(Type.Boolean()),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    items: Type.Object({}, { additionalProperties: true }),
  },
  { additionalProperties: true },
)

const JsonPatchOpSchema = Type.String({
  enum: ['add', 'remove', 'replace'],
})

const PermissionLevelSchema = Type.String({
  enum: ['viewer', 'editor', 'owner'],
})

export const ArtifactResponseSchema = Type.Object({
  artifact: ArtifactSchema,
})

export const PaginatedArtifactsResponseSchema =
  paginatedResponseSchema(ArtifactSchema)

export const ArtifactHistoryEntrySchema = Type.Object(
  {
    _id: Type.String(),
    artifact: Type.String(),
    version: Type.Integer(),
    items: Type.Object({}, { additionalProperties: true }),
    operations: Type.Optional(
      Type.Array(
        Type.Object({
          op: JsonPatchOpSchema,
          path: Type.String(),
          value: Type.Optional(Type.Unknown()),
        }),
      ),
    ),
    actor: Type.String(),
    reason: Type.Optional(Type.String()),
    createdAt: Type.String(),
    updatedAt: Type.Optional(Type.String()),
  },
  { additionalProperties: true },
)

export const PaginatedArtifactsHistoryResponseSchema = paginatedResponseSchema(
  ArtifactHistoryEntrySchema,
)

export const ArtifactCreateRequestSchema = Type.Object({
  title: Type.String(),
  type: Type.String(),
  public: Type.Optional(Type.Boolean()),
  session: Type.Optional(NullableStringSchema),
  items: Type.Optional(Type.Object({}, { additionalProperties: true })),
  content: Type.Optional(Type.String()),
})

export const ArtifactUpdateRequestSchema = Type.Object({
  title: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  public: Type.Optional(Type.Boolean()),
  session: Type.Optional(NullableStringSchema),
})

export const ArtifactPatchItemsRequestSchema = Type.Object({
  operations: Type.Array(
    Type.Object({
      op: JsonPatchOpSchema,
      path: Type.String(),
      value: Type.Optional(Type.Unknown()),
    }),
  ),
  reason: Type.Optional(Type.String()),
})

export const ArtifactPermissionsUpdateRequestSchema = Type.Object({
  permissions: Type.Array(
    Type.Object({
      subjectId: Type.String(),
      level: PermissionLevelSchema,
    }),
  ),
})

export const ArtifactPermissionsResponseSchema = Type.Object({
  permissions: Type.Array(
    Type.Object(
      {
        subjectId: Type.Optional(Type.String()),
        level: PermissionLevelSchema,
      },
      { additionalProperties: true },
    ),
  ),
})

export const ArtifactsV3Domain = {
  params: {
    artifactId: ArtifactIdParamSchema,
  },
  query: {
    list: ArtifactsListQuerySchema,
    history: ArtifactsHistoryQuerySchema,
  },
  request: {
    create: ArtifactCreateRequestSchema,
    update: ArtifactUpdateRequestSchema,
    patchItems: ArtifactPatchItemsRequestSchema,
    permissionsUpdate: ArtifactPermissionsUpdateRequestSchema,
  },
  response: {
    artifact: ArtifactResponseSchema,
    paginated: PaginatedArtifactsResponseSchema,
    history: PaginatedArtifactsHistoryResponseSchema,
    permissions: ArtifactPermissionsResponseSchema,
    error: ErrorResponseSchema,
    message: MessageResponseSchema,
  },
}
