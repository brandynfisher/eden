import {
  filterItemsByPermissions,
  getPermissionWeight,
  matchKeyPattern,
  maxPermissionLevel,
  sanitizeItemsInput,
  validateKeyPath,
  validateKeyPattern,
} from '../../lib/artifactPermissionsV3'
import { ArtifactEditV3 } from '../../models/v3/ArtifactEditV3'
import {
  ArtifactPermissionLevelV3,
  ArtifactPermissionV3,
} from '../../models/v3/ArtifactPermissionV3'
import { ArtifactV3 } from '../../models/v3/ArtifactV3'
import ArtifactV3Repository from '../../repositories/ArtifactV3Repository'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

type PermissionLevel = ArtifactPermissionLevelV3

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
  permissions: Array<{ key?: string; level: PermissionLevel }> = [],
): PermissionLevel | null => {
  if (isOwner(owner, subjectId)) {
    return ArtifactPermissionLevelV3.Owner
  }
  if (isPublic) {
    return ArtifactPermissionLevelV3.Viewer
  }
  const artifactPermission = permissions.find(permission => !permission.key)
  return artifactPermission?.level ?? null
}

const isOwnerLevel = (level?: PermissionLevel | null) =>
  getPermissionWeight(level) >=
  getPermissionWeight(ArtifactPermissionLevelV3.Owner)

const hasAnyPermission = (
  artifactLevel: PermissionLevel | null,
  permissions: Array<{ key?: string; level: PermissionLevel }>,
) => {
  if (artifactLevel) {
    return true
  }
  return permissions.some(
    permission =>
      !!permission.key &&
      getPermissionWeight(permission.level) >=
        getPermissionWeight(ArtifactPermissionLevelV3.Viewer),
  )
}

const resolveKeyLevel = (
  keyPath: string,
  permissions: Array<{ key?: string; level: PermissionLevel }>,
): PermissionLevel | null => {
  const matching = permissions.filter(permission => {
    if (!permission.key) {
      return false
    }
    return matchKeyPattern(permission.key, keyPath)
  })

  return maxPermissionLevel(matching.map(permission => permission.level))
}

const canReadKey = (
  keyPath: string,
  artifactLevel: PermissionLevel | null,
  permissions: Array<{ key?: string; level: PermissionLevel }>,
) => {
  const effective = maxPermissionLevel([
    artifactLevel,
    resolveKeyLevel(keyPath, permissions),
  ])
  return (
    getPermissionWeight(effective) >=
    getPermissionWeight(ArtifactPermissionLevelV3.Viewer)
  )
}

const canWriteKey = (
  keyPath: string,
  artifactLevel: PermissionLevel | null,
  permissions: Array<{ key?: string; level: PermissionLevel }>,
) => {
  const effective = maxPermissionLevel([
    artifactLevel,
    resolveKeyLevel(keyPath, permissions),
  ])
  return (
    getPermissionWeight(effective) >=
    getPermissionWeight(ArtifactPermissionLevelV3.Editor)
  )
}

const applyItemPatch = (
  items: Record<string, unknown>,
  set: Record<string, string>,
  unset: string[],
) => {
  const applySet = (
    obj: Record<string, unknown>,
    path: string,
    value: string,
  ) => {
    const segments = path.split('.').filter(Boolean)
    let cursor: Record<string, unknown> = obj
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        cursor[segment] = value
        return
      }
      const next = cursor[segment]
      if (!next || typeof next !== 'object' || Array.isArray(next)) {
        cursor[segment] = {}
      }
      cursor = cursor[segment] as Record<string, unknown>
    })
  }

  const applyUnset = (obj: Record<string, unknown>, path: string) => {
    const segments = path.split('.').filter(Boolean)
    let cursor: Record<string, unknown> = obj
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        delete cursor[segment]
        return
      }
      const next = cursor[segment]
      if (!next || typeof next !== 'object' || Array.isArray(next)) {
        return
      }
      cursor = next as Record<string, unknown>
    })
  }

  Object.entries(set).forEach(([path, value]) => applySet(items, path, value))
  unset.forEach(path => applyUnset(items, path))
}

const filterArtifactItems = (
  items: Record<string, unknown>,
  artifactLevel: PermissionLevel | null,
  permissions: Array<{ key?: string; level: PermissionLevel }>,
) => {
  if (
    artifactLevel &&
    getPermissionWeight(artifactLevel) >=
      getPermissionWeight(ArtifactPermissionLevelV3.Viewer)
  ) {
    return items
  }

  const filtered = filterItemsByPermissions(items, keyPath =>
    canReadKey(keyPath, artifactLevel, permissions),
  )

  if (!filtered || typeof filtered === 'string') {
    return {}
  }

  return filtered
}

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

  const items = filterArtifactItems(
    artifact.items || {},
    artifactLevel,
    permissions,
  )

  return {
    ...artifact,
    items,
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
    docs: artifacts,
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

  if (!hasAnyPermission(artifactLevel, permissions)) {
    const error = new Error('Not authorized to view this artifact')
    ;(error as any).statusCode = 401
    throw error
  }

  const items = filterArtifactItems(
    artifact.items || {},
    artifactLevel,
    permissions,
  )

  return {
    artifact: {
      ...artifact,
      items,
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
  })

  await ArtifactPermissionV3.create({
    artifact: artifact._id,
    subject: subjectId,
    level: ArtifactPermissionLevelV3.Owner,
    grantedBy: subjectId,
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

  if (
    !artifactLevel ||
    getPermissionWeight(artifactLevel) <
      getPermissionWeight(ArtifactPermissionLevelV3.Editor)
  ) {
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
  set = {},
  unset = [],
  reason,
  authUserId,
}: {
  artifactId: string
  set?: Record<string, unknown>
  unset?: string[]
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

  if (set && (typeof set !== 'object' || Array.isArray(set))) {
    const error = new Error('set must be an object')
    ;(error as any).statusCode = 422
    throw error
  }

  const setEntries: Record<string, string> = {}
  for (const [path, value] of Object.entries(set || {})) {
    if (!validateKeyPath(path)) {
      const error = new Error(`Invalid key path: ${path}`)
      ;(error as any).statusCode = 422
      throw error
    }
    if (!canWriteKey(path, artifactLevel, permissions)) {
      const error = new Error(`Not authorized to edit key: ${path}`)
      ;(error as any).statusCode = 401
      throw error
    }
    if (typeof value === 'string') {
      setEntries[path] = value
    } else if (value === null || value === undefined) {
      setEntries[path] = ''
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      setEntries[path] = String(value)
    } else {
      const error = new Error(`Invalid value for key: ${path}`)
      ;(error as any).statusCode = 422
      throw error
    }
  }

  if (unset && !Array.isArray(unset)) {
    const error = new Error('unset must be an array of strings')
    ;(error as any).statusCode = 422
    throw error
  }

  const unsetEntries = (unset || []).filter(Boolean)
  for (const path of unsetEntries) {
    if (!validateKeyPath(path)) {
      const error = new Error(`Invalid key path: ${path}`)
      ;(error as any).statusCode = 422
      throw error
    }
    if (!canWriteKey(path, artifactLevel, permissions)) {
      const error = new Error(`Not authorized to edit key: ${path}`)
      ;(error as any).statusCode = 401
      throw error
    }
  }

  if (!Object.keys(setEntries).length && !unsetEntries.length) {
    const error = new Error('set or unset is required')
    ;(error as any).statusCode = 422
    throw error
  }

  const updateOps: Record<string, any> = {}
  if (Object.keys(setEntries).length) {
    updateOps.$set = Object.fromEntries(
      Object.entries(setEntries).map(([path, value]) => [
        `items.${path}`,
        value,
      ]),
    )
  }
  if (unsetEntries.length) {
    updateOps.$unset = Object.fromEntries(
      unsetEntries.map(path => [`items.${path}`, '']),
    )
  }

  if (Object.keys(updateOps).length) {
    await ArtifactV3.updateOne({ _id: artifact._id }, updateOps)
  }

  const patch = [
    ...Object.entries(setEntries).map(([path, value]) => ({
      op: 'set' as const,
      path,
      value,
    })),
    ...unsetEntries.map(path => ({
      op: 'unset' as const,
      path,
    })),
  ]

  if (patch.length) {
    await ArtifactEditV3.create({
      artifact: artifact._id,
      actor: subjectId,
      patch,
      reason,
    })
  }

  const updated = await ArtifactV3.findById(artifact._id)
  const updatedObj = updated ? updated.toObject() : artifact.toObject()

  if (
    !updatedObj.items ||
    typeof updatedObj.items !== 'object' ||
    Array.isArray(updatedObj.items)
  ) {
    updatedObj.items = {}
  }

  applyItemPatch(
    updatedObj.items as Record<string, unknown>,
    setEntries,
    unsetEntries,
  )

  const filteredItems = filterArtifactItems(
    updatedObj.items || {},
    artifactLevel,
    permissions,
  )

  return {
    artifact: {
      ...updatedObj,
      items: filteredItems,
    },
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
    key?: string
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
    key?: string
    grantedBy: ObjectId
  }> = []
  const dedupe = new Map<string, number>()

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
    if (permission.key !== undefined) {
      if (!permission.key || !validateKeyPattern(permission.key)) {
        const error = new Error(`Invalid key pattern: ${permission.key}`)
        ;(error as any).statusCode = 422
        throw error
      }
    }

    const payload = {
      artifact: artifact._id,
      subject: new ObjectId(permission.subjectId),
      level: permission.level,
      key: permission.key || undefined,
      grantedBy: subjectId,
    }

    const dedupeKey = `${payload.subject.toString()}::${
      payload.key ?? '__all__'
    }`
    const existingIndex = dedupe.get(dedupeKey)
    if (existingIndex !== undefined) {
      sanitized[existingIndex] = payload
    } else {
      dedupe.set(dedupeKey, sanitized.length)
      sanitized.push(payload)
    }
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

  if (!hasAnyPermission(artifactLevel, permissions)) {
    const error = new Error('Not authorized to view artifact history')
    ;(error as any).statusCode = 401
    throw error
  }

  const sortField = orderBy || 'createdAt'
  const sortDirection =
    typeof direction === 'number' ? (direction < 0 ? -1 : 1) : -1

  const paginated = await (ArtifactEditV3 as any).paginate(
    { artifact: artifact._id },
    {
      page,
      limit,
      sort: { [sortField]: sortDirection },
      customLabels: { totalDocs: 'total', totalPages: 'pages' },
    },
  )

  const filteredDocs = paginated.docs
    .map((doc: any) => {
      const edit = typeof doc.toObject === 'function' ? doc.toObject() : doc
      if (
        artifactLevel &&
        getPermissionWeight(artifactLevel) >=
          getPermissionWeight(ArtifactPermissionLevelV3.Viewer)
      ) {
        return edit
      }
      const filteredPatch = (edit.patch || []).filter((op: any) => {
        if (!op?.path || typeof op.path !== 'string') {
          return false
        }
        return canReadKey(op.path, artifactLevel, permissions)
      })
      if (!filteredPatch.length) {
        return null
      }
      return {
        ...edit,
        patch: filteredPatch,
      }
    })
    .filter(Boolean)

  const total =
    (paginated as any).total ??
    (paginated as any).totalDocs ??
    filteredDocs.length
  const pages =
    (paginated as any).pages ??
    (paginated as any).totalPages ??
    Math.ceil(total / (paginated.limit || limit || 1))

  return {
    ...paginated,
    total,
    pages,
    docs: filteredDocs,
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
