import {
  getPermissionWeight,
  sanitizeItemsInput,
  validateJsonPointer,
} from '../../lib/artifactPermissionsV3'
import {
  ArtifactPermissionLevelV3,
  ArtifactPermissionV3,
} from '../../models/v3/ArtifactPermissionV3'
import { ArtifactV3 } from '../../models/v3/ArtifactV3'
import { ArtifactVersionV3 } from '../../models/v3/ArtifactVersionV3'
import ArtifactV3Repository from '../../repositories/ArtifactV3Repository'
import jsonpatch from 'fast-json-patch'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

type PermissionLevel = ArtifactPermissionLevelV3

export type JsonPatchOperation = {
  op: 'add' | 'remove' | 'replace'
  path: string
  value?: unknown
}

const ensureObjectId = (value?: string | ObjectId | null) => {
  if (!value) {
    return undefined
  }
  if (value instanceof ObjectId) {
    return value
  }
  return new ObjectId(value)
}

const isOwner = (artifactOwner?: ObjectId, subjectId?: ObjectId) => {
  if (!artifactOwner || !subjectId) {
    return false
  }
  return artifactOwner.toString() === subjectId.toString()
}

const resolveArtifactLevel = (
  { owner, public: isPublic }: { owner: ObjectId; public: boolean },
  subjectId?: ObjectId,
  permissions: Array<{ level: PermissionLevel }> = [],
): PermissionLevel | null => {
  if (isOwner(owner, subjectId)) {
    return ArtifactPermissionLevelV3.Owner
  }
  if (isPublic) {
    return ArtifactPermissionLevelV3.Viewer
  }
  const artifactPermission = permissions[0]
  return artifactPermission?.level ?? null
}

const isOwnerLevel = (level?: PermissionLevel | null) =>
  getPermissionWeight(level) >=
  getPermissionWeight(ArtifactPermissionLevelV3.Owner)

const isEditorLevel = (level?: PermissionLevel | null) =>
  getPermissionWeight(level) >=
  getPermissionWeight(ArtifactPermissionLevelV3.Editor)

const isViewerLevel = (level?: PermissionLevel | null) =>
  getPermissionWeight(level) >=
  getPermissionWeight(ArtifactPermissionLevelV3.Viewer)

const loadArtifactPermissions = async (
  artifactId: ObjectId,
  subjectId?: ObjectId,
) => {
  if (!subjectId) {
    return []
  }
  return ArtifactPermissionV3.find({
    artifact: artifactId,
    subject: subjectId,
  })
}

const requireAuthUser = (authUserId?: string | ObjectId): ObjectId => {
  if (!authUserId) {
    throw new Error('Unauthorized')
  }
  const resolved = ensureObjectId(authUserId)
  if (!resolved) {
    throw new Error('Unauthorized')
  }
  return resolved
}

const formatArtifactResponse = async (artifact: any, subjectId?: ObjectId) => {
  const permissions = await loadArtifactPermissions(artifact._id, subjectId)
  const artifactLevel = resolveArtifactLevel(
    { owner: artifact.owner, public: artifact.public },
    subjectId,
    permissions,
  )

  if (!isViewerLevel(artifactLevel)) {
    return null
  }

  return {
    ...artifact,
    items: artifact.items || {},
  }
}

export async function listArtifactsV3Core({
  ownerId,
  type,
  sessionId,
  page = 1,
  limit = 20,
  orderBy,
  direction,
  authUserId,
}: {
  ownerId?: string
  type?: string
  sessionId?: string
  page?: number
  limit?: number
  orderBy?: string
  direction?: number
  authUserId?: string | ObjectId
}) {
  const subjectId = ensureObjectId(authUserId ?? undefined)
  const filter: Record<string, any> = {}

  if (ownerId) {
    filter.owner = new ObjectId(ownerId)
  }

  if (type) {
    filter.type = type
  }

  if (sessionId) {
    filter.session = new ObjectId(sessionId)
  }

  if (!subjectId) {
    filter.public = true
  } else if (!ownerId || ownerId !== subjectId.toString()) {
    const permissions = await ArtifactPermissionV3.find({
      subject: subjectId,
    }).select({ artifact: 1 })
    const permittedArtifactIds = permissions.map(
      permission => permission.artifact,
    )

    if (ownerId) {
      filter.$or = [
        { public: true },
        ...(permittedArtifactIds.length
          ? [{ _id: { $in: permittedArtifactIds } }]
          : []),
      ]
    } else {
      filter.$or = [
        { owner: subjectId },
        { public: true },
        ...(permittedArtifactIds.length
          ? [{ _id: { $in: permittedArtifactIds } }]
          : []),
      ]
    }
  }

  const artifactRepository = new ArtifactV3Repository(ArtifactV3)
  const sortField = orderBy || 'createdAt'
  const sortDirection =
    typeof direction === 'number' ? (direction < 0 ? -1 : 1) : -1
  const result = await artifactRepository.query(filter, {
    page,
    limit,
    sort: { [sortField]: sortDirection },
  })

  const artifacts = await Promise.all(
    result.docs.map(async doc => {
      const artifact = typeof doc.toObject === 'function' ? doc.toObject() : doc
      return formatArtifactResponse(artifact, subjectId)
    }),
  )

  return {
    ...result,
    docs: artifacts.filter(Boolean),
  }
}

export async function getArtifactV3Core({
  artifactId,
  authUserId,
}: {
  artifactId: string
  authUserId?: string | ObjectId
}) {
  const subjectId = ensureObjectId(authUserId ?? undefined)

  const artifactDoc = await ArtifactV3.findOne({
    _id: artifactId,
    deleted: false,
  })

  if (!artifactDoc) {
    const error = new Error('Artifact not found')
    ;(error as any).statusCode = 404
    throw error
  }

  const artifact = artifactDoc.toObject()

  const permissions = await loadArtifactPermissions(artifact._id, subjectId)
  const artifactLevel = resolveArtifactLevel(
    { owner: artifact.owner, public: artifact.public },
    subjectId,
    permissions,
  )

  if (!isViewerLevel(artifactLevel)) {
    const error = new Error('Not authorized to view this artifact')
    ;(error as any).statusCode = 401
    throw error
  }

  return {
    artifact: {
      ...artifact,
      items: artifact.items || {},
    },
  }
}

export async function createArtifactV3Core({
  title,
  type,
  public: isPublic,
  session,
  items,
  content,
  authUserId,
}: {
  title: string
  type: string
  public?: boolean
  session?: string
  items?: Record<string, unknown>
  content?: string
  authUserId?: string | ObjectId
}) {
  const subjectId = requireAuthUser(authUserId)

  if (!title || !type) {
    const error = new Error('title and type are required')
    ;(error as any).statusCode = 422
    throw error
  }

  if (items && (typeof items !== 'object' || Array.isArray(items))) {
    const error = new Error('items must be an object')
    ;(error as any).statusCode = 422
    throw error
  }

  const { sanitized, errors } = sanitizeItemsInput(items ?? {})
  if (errors.length) {
    const error = new Error(errors.join(', '))
    ;(error as any).statusCode = 422
    throw error
  }

  if (content) {
    sanitized.content = content
  }

  const artifact = await ArtifactV3.create({
    owner: subjectId,
    title,
    type,
    public: isPublic ?? false,
    session: session ? new ObjectId(session) : undefined,
    originSession: session ? new ObjectId(session) : undefined,
    items: sanitized,
    version: 1,
  })

  await ArtifactPermissionV3.create({
    artifact: artifact._id,
    subject: subjectId,
    level: ArtifactPermissionLevelV3.Owner,
    grantedBy: subjectId,
  })

  // Create initial version snapshot
  await ArtifactVersionV3.create({
    artifact: artifact._id,
    version: 1,
    items: sanitized,
    actor: subjectId,
    reason: 'Initial creation',
  })

  return {
    artifact: artifact.toObject(),
  }
}

export async function updateArtifactV3Core({
  artifactId,
  title,
  type,
  public: isPublic,
  session,
  authUserId,
}: {
  artifactId: string
  title?: string
  type?: string
  public?: boolean
  session?: string | null
  authUserId?: string | ObjectId
}) {
  const subjectId = requireAuthUser(authUserId)

  const artifact = await ArtifactV3.findOne({
    _id: artifactId,
    deleted: false,
  })

  if (!artifact) {
    const error = new Error('Artifact not found')
    ;(error as any).statusCode = 404
    throw error
  }

  const permissions = await loadArtifactPermissions(artifact._id, subjectId)
  const artifactLevel = resolveArtifactLevel(
    { owner: artifact.owner, public: artifact.public },
    subjectId,
    permissions,
  )

  if (!isEditorLevel(artifactLevel)) {
    const error = new Error('Not authorized to update this artifact')
    ;(error as any).statusCode = 401
    throw error
  }

  if (
    (typeof isPublic === 'boolean' || session !== undefined) &&
    !isOwnerLevel(artifactLevel)
  ) {
    const error = new Error('Only owners can update privacy or session fields')
    ;(error as any).statusCode = 401
    throw error
  }

  const update: Record<string, unknown> = {}
  if (title !== undefined) {
    update.title = title
  }
  if (type !== undefined) {
    update.type = type
  }
  if (typeof isPublic === 'boolean') {
    update.public = isPublic
  }
  if (session !== undefined) {
    update.session = session ? new ObjectId(session) : null
  }

  await ArtifactV3.updateOne({ _id: artifact._id }, { $set: update })
  const updated = await ArtifactV3.findById(artifact._id)

  return {
    artifact: updated ? updated.toObject() : artifact.toObject(),
  }
}

export async function deleteArtifactV3Core({
  artifactId,
  authUserId,
}: {
  artifactId: string
  authUserId?: string | ObjectId
}) {
  const subjectId = requireAuthUser(authUserId)

  const artifact = await ArtifactV3.findOne({
    _id: artifactId,
    deleted: false,
  })

  if (!artifact) {
    const error = new Error('Artifact not found')
    ;(error as any).statusCode = 404
    throw error
  }

  const permissions = await loadArtifactPermissions(artifact._id, subjectId)
  const artifactLevel = resolveArtifactLevel(
    { owner: artifact.owner, public: artifact.public },
    subjectId,
    permissions,
  )

  if (!isOwnerLevel(artifactLevel)) {
    const error = new Error('Only owners can delete artifacts')
    ;(error as any).statusCode = 401
    throw error
  }

  await ArtifactV3.updateOne({ _id: artifact._id }, { $set: { deleted: true } })

  return {
    message: 'Artifact deleted',
  }
}

export async function patchArtifactItemsV3Core({
  artifactId,
  operations,
  reason,
  authUserId,
}: {
  artifactId: string
  operations: JsonPatchOperation[]
  reason?: string
  authUserId?: string | ObjectId
}) {
  const subjectId = requireAuthUser(authUserId)

  const artifact = await ArtifactV3.findOne({
    _id: artifactId,
    deleted: false,
  })

  if (!artifact) {
    const error = new Error('Artifact not found')
    ;(error as any).statusCode = 404
    throw error
  }

  const permissions = await loadArtifactPermissions(artifact._id, subjectId)
  const artifactLevel = resolveArtifactLevel(
    { owner: artifact.owner, public: artifact.public },
    subjectId,
    permissions,
  )

  if (!isEditorLevel(artifactLevel)) {
    const error = new Error('Not authorized to edit this artifact')
    ;(error as any).statusCode = 401
    throw error
  }

  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    const error = new Error('operations array is required')
    ;(error as any).statusCode = 422
    throw error
  }

  // Validate operations
  const validOps = ['add', 'remove', 'replace']
  for (const op of operations) {
    if (!op.op || !validOps.includes(op.op)) {
      const error = new Error(
        `Invalid operation: ${op.op}. Must be one of: ${validOps.join(', ')}`,
      )
      ;(error as any).statusCode = 422
      throw error
    }
    if (!op.path || !validateJsonPointer(op.path)) {
      const error = new Error(
        `Invalid path: ${op.path}. Must be a valid JSON Pointer (e.g., /characters/0/name)`,
      )
      ;(error as any).statusCode = 422
      throw error
    }
    if ((op.op === 'add' || op.op === 'replace') && op.value === undefined) {
      const error = new Error(`Operation ${op.op} requires a value`)
      ;(error as any).statusCode = 422
      throw error
    }
  }

  // Get current items
  const currentItems = (artifact.items as Record<string, unknown>) || {}

  // Apply JSON Patch operations
  let patchedItems: Record<string, unknown>
  try {
    const result = jsonpatch.applyPatch(
      jsonpatch.deepClone(currentItems),
      operations.map(op => ({
        op: op.op,
        path: op.path,
        value: op.value,
      })),
      true, // validate
      false, // mutate (false = don't mutate original)
    )
    patchedItems = result.newDocument as Record<string, unknown>
  } catch (err: any) {
    const error = new Error(`Failed to apply patch: ${err.message}`)
    ;(error as any).statusCode = 422
    throw error
  }

  // Increment version and update
  const newVersion = (artifact.version || 1) + 1

  await ArtifactV3.updateOne(
    { _id: artifact._id },
    {
      $set: {
        items: patchedItems,
        version: newVersion,
      },
    },
  )

  // Create version snapshot with operations
  await ArtifactVersionV3.create({
    artifact: artifact._id,
    version: newVersion,
    items: patchedItems,
    operations,
    actor: subjectId,
    reason,
  })

  const updated = await ArtifactV3.findById(artifact._id)

  return {
    artifact: updated
      ? updated.toObject()
      : { ...artifact.toObject(), items: patchedItems, version: newVersion },
  }
}

export async function getArtifactPermissionsV3Core({
  artifactId,
  authUserId,
}: {
  artifactId: string
  authUserId?: string | ObjectId
}) {
  const subjectId = requireAuthUser(authUserId)

  const artifact = await ArtifactV3.findOne({
    _id: artifactId,
    deleted: false,
  })

  if (!artifact) {
    const error = new Error('Artifact not found')
    ;(error as any).statusCode = 404
    throw error
  }

  const permissions = await loadArtifactPermissions(artifact._id, subjectId)
  const artifactLevel = resolveArtifactLevel(
    { owner: artifact.owner, public: artifact.public },
    subjectId,
    permissions,
  )

  if (!isOwnerLevel(artifactLevel)) {
    const error = new Error('Only owners can view permissions')
    ;(error as any).statusCode = 401
    throw error
  }

  const artifactPermissions = await ArtifactPermissionV3.find({
    artifact: artifact._id,
  }).populate('subject', '_id userId username userImage type')

  return { permissions: artifactPermissions }
}

export async function updateArtifactPermissionsV3Core({
  artifactId,
  permissions,
  authUserId,
}: {
  artifactId: string
  permissions: Array<{
    subjectId: string
    level: ArtifactPermissionLevelV3
  }>
  authUserId?: string | ObjectId
}) {
  const subjectId = requireAuthUser(authUserId)

  const artifact = await ArtifactV3.findOne({
    _id: artifactId,
    deleted: false,
  })

  if (!artifact) {
    const error = new Error('Artifact not found')
    ;(error as any).statusCode = 404
    throw error
  }

  const permissionsForOwner = await loadArtifactPermissions(
    artifact._id,
    subjectId,
  )
  const artifactLevel = resolveArtifactLevel(
    { owner: artifact.owner, public: artifact.public },
    subjectId,
    permissionsForOwner,
  )

  if (!isOwnerLevel(artifactLevel)) {
    const error = new Error('Only owners can modify permissions')
    ;(error as any).statusCode = 401
    throw error
  }

  const sanitized: Array<{
    artifact: ObjectId
    subject: ObjectId
    level: ArtifactPermissionLevelV3
    grantedBy: ObjectId
  }> = []
  const dedupe = new Set<string>()

  for (const permission of permissions || []) {
    if (!permission.subjectId || !permission.level) {
      continue
    }
    if (permission.subjectId === artifact.owner.toString()) {
      continue
    }
    if (!Object.values(ArtifactPermissionLevelV3).includes(permission.level)) {
      continue
    }

    const dedupeKey = permission.subjectId
    if (dedupe.has(dedupeKey)) {
      continue
    }
    dedupe.add(dedupeKey)

    sanitized.push({
      artifact: artifact._id,
      subject: new ObjectId(permission.subjectId),
      level: permission.level,
      grantedBy: subjectId,
    })
  }

  await ArtifactPermissionV3.deleteMany({ artifact: artifact._id })

  await ArtifactPermissionV3.insertMany([
    {
      artifact: artifact._id,
      subject: artifact.owner,
      level: ArtifactPermissionLevelV3.Owner,
      grantedBy: subjectId,
    },
    ...sanitized,
  ])

  const updatedPermissions = await ArtifactPermissionV3.find({
    artifact: artifact._id,
  }).populate('subject', '_id userId username userImage type')

  return { permissions: updatedPermissions }
}

export async function listArtifactHistoryV3Core({
  artifactId,
  page = 1,
  limit = 20,
  orderBy,
  direction,
  authUserId,
}: {
  artifactId: string
  page?: number
  limit?: number
  orderBy?: string
  direction?: number
  authUserId?: string | ObjectId
}) {
  const subjectId = requireAuthUser(authUserId)

  const artifact = await ArtifactV3.findOne({
    _id: artifactId,
    deleted: false,
  })

  if (!artifact) {
    const error = new Error('Artifact not found')
    ;(error as any).statusCode = 404
    throw error
  }

  const permissions = await loadArtifactPermissions(artifact._id, subjectId)
  const artifactLevel = resolveArtifactLevel(
    { owner: artifact.owner, public: artifact.public },
    subjectId,
    permissions,
  )

  if (!isViewerLevel(artifactLevel)) {
    const error = new Error('Not authorized to view artifact history')
    ;(error as any).statusCode = 401
    throw error
  }

  const sortField = orderBy || 'createdAt'
  const sortDirection =
    typeof direction === 'number' ? (direction < 0 ? -1 : 1) : -1

  const paginated = await (ArtifactVersionV3 as any).paginate(
    { artifact: artifact._id },
    {
      page,
      limit,
      sort: { [sortField]: sortDirection },
      customLabels: { totalDocs: 'total', totalPages: 'pages' },
    },
  )

  const docs = paginated.docs.map((doc: any) =>
    typeof doc.toObject === 'function' ? doc.toObject() : doc,
  )

  const total =
    (paginated as any).total ?? (paginated as any).totalDocs ?? docs.length
  const pages =
    (paginated as any).pages ??
    (paginated as any).totalPages ??
    Math.ceil(total / (paginated.limit || limit || 1))

  return {
    ...paginated,
    total,
    pages,
    docs,
  }
}

export const listArtifactsV3 = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  void server
  try {
    const result = await listArtifactsV3Core({
      ...(request.query as any),
      authUserId: request.user?.userId,
    })
    return reply.status(200).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to list artifacts',
    })
  }
}

export const getArtifactV3 = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { artifactId } = request.params as { artifactId: string }
    const result = await getArtifactV3Core({
      artifactId,
      authUserId: request.user?.userId,
    })
    return reply.status(200).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to fetch artifact',
    })
  }
}

export const createArtifactV3 = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const result = await createArtifactV3Core({
      ...(request.body as any),
      authUserId: request.user?.userId,
    })
    return reply.status(201).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to create artifact',
    })
  }
}

export const updateArtifactV3 = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { artifactId } = request.params as { artifactId: string }
    const result = await updateArtifactV3Core({
      artifactId,
      ...(request.body as any),
      authUserId: request.user?.userId,
    })
    return reply.status(200).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to update artifact',
    })
  }
}

export const deleteArtifactV3 = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { artifactId } = request.params as { artifactId: string }
    const result = await deleteArtifactV3Core({
      artifactId,
      authUserId: request.user?.userId,
    })
    return reply.status(200).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to delete artifact',
    })
  }
}

export const patchArtifactItemsV3 = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { artifactId } = request.params as { artifactId: string }
    const result = await patchArtifactItemsV3Core({
      artifactId,
      ...(request.body as any),
      authUserId: request.user?.userId,
    })
    return reply.status(200).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to update artifact items',
    })
  }
}

export const getArtifactPermissionsV3 = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { artifactId } = request.params as { artifactId: string }
    const result = await getArtifactPermissionsV3Core({
      artifactId,
      authUserId: request.user?.userId,
    })
    return reply.status(200).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to fetch permissions',
    })
  }
}

export const updateArtifactPermissionsV3 = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { artifactId } = request.params as { artifactId: string }
    const result = await updateArtifactPermissionsV3Core({
      artifactId,
      ...(request.body as any),
      authUserId: request.user?.userId,
    })
    return reply.status(200).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to update permissions',
    })
  }
}

export const listArtifactHistoryV3 = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { artifactId } = request.params as { artifactId: string }
    const result = await listArtifactHistoryV3Core({
      artifactId,
      ...(request.query as any),
      authUserId: request.user?.userId,
    })
    return reply.status(200).send(result)
  } catch (error: any) {
    return reply.status(error.statusCode || 500).send({
      message: error.message || 'Failed to fetch history',
    })
  }
}
