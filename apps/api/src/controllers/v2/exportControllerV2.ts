import {
  DATA_EXPORTS,
  DEFAULT_EXPORT_FILTERS,
} from '../../constants/exportConstants'
import { Notification } from '../../models/Notification'
import { CreationV2 } from '../../models/v2/CreationV2'
import {
  DataExportDocument,
  DataExportMediaType,
  DataExportStatus,
  DataExportV2,
} from '../../models/v2/DataExportV2'
import { Message } from '../../models/v2/Message'
import { Session } from '../../models/v2/SessionV2'
import archiver from 'archiver'
import { createHash } from 'crypto'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import pLimit from 'p-limit'
import { PassThrough } from 'stream'

type CreateExportBody = {
  include_chats?: boolean
  include_media_files?: boolean
  media_types?: DataExportMediaType[]
  agent_ids?: string[]
  created_after?: string | Date | null
  created_before?: string | Date | null
}

type ListExportQuery = {
  status?: DataExportStatus
  limit?: number
  offset?: number
}

type ExportEstimate = {
  sessions: number
  messages: number
  creations: number
  files: number
  bytes: number
}

const VALID_MEDIA_TYPES: DataExportMediaType[] = ['images', 'videos', 'audio']

const buildAgentFilter = (agentIds: string[] | undefined) => {
  if (!agentIds || agentIds.length === 0) {
    return []
  }
  return agentIds.flatMap(id => {
    try {
      return [new ObjectId(id)]
    } catch {
      return []
    }
  })
}

const normalizeMediaTypes = (mediaTypes?: DataExportMediaType[]) => {
  if (mediaTypes === undefined) {
    return [...DEFAULT_EXPORT_FILTERS.media_types]
  }
  return mediaTypes.filter(type => VALID_MEDIA_TYPES.includes(type))
}

const parseDateInput = (value?: string | Date | null) => {
  if (!value) {
    return null
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

const hasOwn = (obj: object, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key)

const resolveDateRange = (body: CreateExportBody) => {
  const includeFilter =
    hasOwn(body, 'created_after') || hasOwn(body, 'created_before')
  if (!includeFilter) {
    const createdBefore = nowUtc()
    const createdAfter = new Date(
      createdBefore.getTime() -
        DATA_EXPORTS.DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000,
    )
    return { createdAfter, createdBefore }
  }

  const createdAfter = parseDateInput(body.created_after)
  const createdBefore = parseDateInput(body.created_before)
  return { createdAfter, createdBefore }
}

const buildCreatedAtQuery = (
  createdAfter?: Date | null,
  createdBefore?: Date | null,
) => {
  if (!createdAfter && !createdBefore) {
    return undefined
  }
  const query: Record<string, Date> = {}
  if (createdAfter) {
    query.$gte = createdAfter
  }
  if (createdBefore) {
    query.$lte = createdBefore
  }
  return query
}

const buildExportQueries = ({
  userId,
  agentIds,
  mediaTypes,
  createdAfter,
  createdBefore,
}: {
  userId: string | ObjectId
  agentIds: ObjectId[]
  mediaTypes: DataExportMediaType[]
  createdAfter?: Date | null
  createdBefore?: Date | null
}) => {
  const createdAtQuery = buildCreatedAtQuery(createdAfter, createdBefore)
  const userObjectId =
    userId instanceof ObjectId ? userId : new ObjectId(userId)

  const sessionQuery: Record<string, any> = {
    $or: [{ owner: userObjectId }, { users: userObjectId }],
  }
  if (agentIds.length) {
    sessionQuery.agents = { $in: agentIds }
  }
  if (createdAtQuery) {
    sessionQuery.createdAt = createdAtQuery
  }

  const creationQuery: Record<string, any> = {
    user: userObjectId,
    deleted: { $ne: true },
  }
  if (agentIds.length) {
    creationQuery.agent = { $in: agentIds }
  }
  if (createdAtQuery) {
    creationQuery.createdAt = createdAtQuery
  }

  const mediaFilters = mediaTypeToMimeFilters(mediaTypes)
  if (mediaFilters.length) {
    creationQuery.$or = mediaFilters
  }

  return { sessionQuery, creationQuery }
}

const estimateExport = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const body = (request.body || {}) as CreateExportBody
  const includeChats =
    body.include_chats ?? DEFAULT_EXPORT_FILTERS.include_chats
  const includeMediaFiles =
    body.include_media_files ?? DEFAULT_EXPORT_FILTERS.include_media_files
  const mediaTypes = normalizeMediaTypes(body.media_types)
  const agentIds = buildAgentFilter(body.agent_ids)
  const { createdAfter, createdBefore } = resolveDateRange(body)

  if (createdAfter && createdBefore && createdAfter > createdBefore) {
    return reply.status(400).send({
      message: 'Invalid date range. Start date must be before end date.',
    })
  }

  if (!includeChats && mediaTypes.length === 0) {
    return reply.status(400).send({
      message: 'Select chats and/or at least one media type.',
    })
  }

  const { sessionQuery, creationQuery } = buildExportQueries({
    userId,
    agentIds,
    mediaTypes,
    createdAfter,
    createdBefore,
  })

  const sessions = includeChats
    ? await Session.find(sessionQuery).select({ _id: 1 }).lean()
    : []
  const sessionIds = sessions.map(session => session._id)
  const messages =
    includeChats && sessionIds.length
      ? await Message.countDocuments({ session: { $in: sessionIds } })
      : 0

  const includeCreations = mediaTypes.length > 0
  const creations = includeCreations
    ? await CreationV2.find(creationQuery)
        .select({ _id: 1, filename: 1, url: 1 })
        .lean()
    : []

  const files = includeMediaFiles
    ? (creations
        .map(creation => {
          const key = extractS3Key(creation.filename || creation.url || '')
          if (!key) {
            return null
          }
          return {
            key,
            creationId: creation._id?.toString() || '',
          }
        })
        .filter(Boolean) as { key: string; creationId: string }[])
    : []

  const estimate: ExportEstimate = {
    sessions: sessions.length,
    messages,
    creations: creations.length,
    files: includeMediaFiles ? files.length : 0,
    bytes: 0,
  }

  if (includeMediaFiles && files.length > DATA_EXPORTS.FILES_LIMIT) {
    return reply.status(200).send({
      estimate,
      limits: {
        max_files: DATA_EXPORTS.FILES_LIMIT,
        max_bytes: DATA_EXPORTS.SIZE_LIMIT_BYTES,
      },
      over_limit: true,
      over_limit_reason: `Export exceeds the file limit (${DATA_EXPORTS.FILES_LIMIT}).`,
    })
  }

  let totalBytes = 0
  const missingFiles: string[] = []
  if (includeMediaFiles && files.length) {
    const bucket = server.config.AWS_S3_BUCKET
    if (!bucket) {
      return reply.status(500).send({
        message: 'Storage not configured for exports.',
      })
    }
    const limit = pLimit(DATA_EXPORTS.HEAD_CONCURRENCY)
    const sizes = await Promise.all(
      files.map(file =>
        limit(async () => {
          try {
            const head = await server.s3
              .headObject({
                Bucket: bucket,
                Key: file.key,
              })
              .promise()
            return head.ContentLength || 0
          } catch {
            missingFiles.push(file.creationId)
            return 0
          }
        }),
      ),
    )
    totalBytes = sizes.reduce((sum, size) => sum + size, 0)
  }

  estimate.bytes = includeMediaFiles ? totalBytes : 0
  estimate.files = includeMediaFiles ? files.length - missingFiles.length : 0

  const overLimit =
    includeMediaFiles && totalBytes > DATA_EXPORTS.SIZE_LIMIT_BYTES
  return reply.status(200).send({
    estimate,
    missing_files: missingFiles.length,
    limits: {
      max_files: DATA_EXPORTS.FILES_LIMIT,
      max_bytes: DATA_EXPORTS.SIZE_LIMIT_BYTES,
    },
    over_limit: overLimit,
    over_limit_reason: overLimit
      ? `Export exceeds the size limit (${Math.floor(
          DATA_EXPORTS.SIZE_LIMIT_BYTES / (1024 * 1024 * 1024),
        )} GB).`
      : null,
  })
}

const mediaTypeToMimeFilters = (mediaTypes: DataExportMediaType[]) => {
  const filters = []
  if (mediaTypes.includes('images')) {
    filters.push({ 'mediaAttributes.mimeType': { $regex: '^image/' } })
  }
  if (mediaTypes.includes('videos')) {
    filters.push({ 'mediaAttributes.mimeType': { $regex: '^video/' } })
    filters.push({ 'mediaAttributes.mimeType': 'image/gif' })
  }
  if (mediaTypes.includes('audio')) {
    filters.push({ 'mediaAttributes.mimeType': { $regex: '^audio/' } })
  }
  return filters
}

const extractS3Key = (value?: string | null) => {
  if (!value) {
    return null
  }
  if (value.startsWith('http')) {
    try {
      const url = new URL(value)
      return url.pathname.replace(/^\//, '')
    } catch {
      return null
    }
  }
  return value.replace(/^\//, '')
}

const nowUtc = () => new Date()

const createExportNotification = async (
  server: FastifyInstance,
  userId: string,
  title: string,
  message: string,
  exportId: string,
) => {
  const notification = new Notification({
    user: userId,
    type: 'system_alert',
    title,
    message,
    channels: ['in_app'],
    metadata: {
      export_id: exportId,
    },
    action_url: 'modal:user-settings?tab=data',
  })

  await notification.save()

  if (server.internalMessages) {
    server.internalMessages.publish('notifications', {
      event: 'notification-created',
      data: {
        user_id: userId,
        notification_id: notification._id.toString(),
        type: notification.type,
      },
    })
  }
}

const markExportFailed = async (
  server: FastifyInstance,
  exportDoc: DataExportDocument,
  errorMessage: string,
) => {
  exportDoc.status = 'failed'
  exportDoc.error = errorMessage
  exportDoc.completed_at = nowUtc()
  await exportDoc.save()

  await createExportNotification(
    server,
    exportDoc.user.toString(),
    'Data export failed',
    errorMessage,
    exportDoc._id.toString(),
  )
}

const markExportCompleted = async (
  server: FastifyInstance,
  exportDoc: DataExportDocument,
  archive: DataExportDocument['archive'],
  counts: DataExportDocument['counts'],
) => {
  exportDoc.status = 'completed'
  exportDoc.archive = archive || null
  exportDoc.counts = counts || null
  exportDoc.completed_at = nowUtc()
  exportDoc.expires_at = archive?.expires_at || null
  await exportDoc.save()

  await createExportNotification(
    server,
    exportDoc.user.toString(),
    'Your data export is ready',
    'Your data export has finished. Download is available for 48 hours.',
    exportDoc._id.toString(),
  )
}

const markExportCancelled = async (exportDoc: DataExportDocument) => {
  exportDoc.status = 'cancelled'
  exportDoc.cancelled_at = nowUtc()
  await exportDoc.save()
}

const isExportCancelled = async (exportId: string) => {
  const latest = await DataExportV2.findById(exportId).lean()
  return latest?.status === 'cancelled'
}

const processExport = async (server: FastifyInstance, exportId: string) => {
  const exportDoc = await DataExportV2.findById(exportId)
  if (!exportDoc) {
    return
  }

  if (exportDoc.status !== 'queued') {
    return
  }

  exportDoc.status = 'running'
  exportDoc.started_at = nowUtc()
  exportDoc.error = null
  await exportDoc.save()

  const userId = exportDoc.user.toString()
  const includeChats = exportDoc.filters.include_chats
  const includeMediaFiles = exportDoc.filters.include_media_files
  const agentIds = exportDoc.filters.agent_ids || []
  const mediaTypes = normalizeMediaTypes(exportDoc.filters.media_types)
  const createdAfter = parseDateInput(exportDoc.filters.created_after)
  const createdBefore = parseDateInput(exportDoc.filters.created_before)
  const createdAtQuery = buildCreatedAtQuery(createdAfter, createdBefore)

  try {
    const bucket = server.config.AWS_S3_BUCKET
    if (!bucket) {
      await markExportFailed(
        server,
        exportDoc,
        'Storage not configured for exports.',
      )
      return
    }

    if (await isExportCancelled(exportId)) {
      await markExportCancelled(exportDoc)
      return
    }

    const sessionQuery: Record<string, any> = {
      $or: [{ owner: new ObjectId(userId) }, { users: new ObjectId(userId) }],
    }
    if (agentIds.length) {
      sessionQuery.agents = { $in: agentIds }
    }
    if (createdAtQuery) {
      sessionQuery.createdAt = createdAtQuery
    }

    const sessions = includeChats ? await Session.find(sessionQuery).lean() : []

    const includeCreations = mediaTypes.length > 0
    const creationQuery: Record<string, any> = {
      user: new ObjectId(userId),
      deleted: { $ne: true },
    }
    if (agentIds.length) {
      creationQuery.agent = { $in: agentIds }
    }
    if (createdAtQuery) {
      creationQuery.createdAt = createdAtQuery
    }

    const mediaFilters = mediaTypeToMimeFilters(mediaTypes)
    if (mediaFilters.length) {
      creationQuery.$or = mediaFilters
    }

    const creations = includeCreations
      ? await CreationV2.find(creationQuery).lean()
      : []

    const files = includeMediaFiles
      ? (creations
          .map(creation => {
            const key = extractS3Key(creation.filename || creation.url || '')
            if (!key) {
              return null
            }
            const extension = key.split('.').pop() || 'bin'
            return {
              key,
              creationId: creation._id?.toString() || '',
              extension,
            }
          })
          .filter(Boolean) as {
          key: string
          creationId: string
          extension: string
        }[])
      : []

    if (includeMediaFiles && files.length > DATA_EXPORTS.FILES_LIMIT) {
      await markExportFailed(
        server,
        exportDoc,
        `Export exceeds the file limit (${DATA_EXPORTS.FILES_LIMIT}). Try a metadata-only export.`,
      )
      return
    }

    let totalBytes = 0
    const missingFiles: string[] = []
    if (includeMediaFiles && files.length) {
      const limit = pLimit(DATA_EXPORTS.HEAD_CONCURRENCY)
      const sizes = await Promise.all(
        files.map(file =>
          limit(async () => {
            try {
              const head = await server.s3
                .headObject({
                  Bucket: bucket,
                  Key: file.key,
                })
                .promise()
              return head.ContentLength || 0
            } catch {
              missingFiles.push(file.creationId)
              return 0
            }
          }),
        ),
      )
      totalBytes = sizes.reduce((sum, size) => sum + size, 0)
    }

    if (includeMediaFiles && totalBytes > DATA_EXPORTS.SIZE_LIMIT_BYTES) {
      await markExportFailed(
        server,
        exportDoc,
        `Export exceeds the size limit (${Math.floor(
          DATA_EXPORTS.SIZE_LIMIT_BYTES / (1024 * 1024 * 1024),
        )} GB). Try a metadata-only export.`,
      )
      return
    }

    if (await isExportCancelled(exportId)) {
      await markExportCancelled(exportDoc)
      return
    }

    const exportFilename = `eden-data-export-${exportId}.zip`
    const exportKey = `exports/${userId}/${exportFilename}`
    const expiresAt = new Date(
      Date.now() + DATA_EXPORTS.EXPIRATION_HOURS * 60 * 60 * 1000,
    )

    const archive = archiver('zip', { zlib: { level: 9 } })
    const passThrough = new PassThrough()
    const hash = createHash('sha256')
    let archiveBytes = 0

    passThrough.on('data', chunk => {
      archiveBytes += chunk.length
      hash.update(chunk)
    })

    const uploadPromise = server.s3
      .upload({
        Bucket: bucket,
        Key: exportKey,
        Body: passThrough,
        ContentType: 'application/zip',
        ContentDisposition: `attachment; filename="${exportFilename}"`,
        Metadata: {
          export_id: exportId,
          user_id: userId,
        },
      })
      .promise()

    archive.on('warning', err => {
      server.log.warn({ err }, '[EXPORT] Archive warning')
    })

    archive.on('error', err => {
      throw err
    })

    archive.pipe(passThrough)

    const counts = {
      sessions: sessions.length,
      messages: 0,
      creations: creations.length,
      files: includeMediaFiles ? files.length - missingFiles.length : 0,
      bytes: includeMediaFiles ? totalBytes : 0,
    }

    const manifest = {
      export_id: exportId,
      user_id: userId,
      created_at: exportDoc.createdAt,
      filters: {
        include_chats: includeChats,
        include_media_files: includeMediaFiles,
        media_types: mediaTypes,
        agent_ids: agentIds.map(id => id.toString()),
        created_after: createdAfter ? createdAfter.toISOString() : null,
        created_before: createdBefore ? createdBefore.toISOString() : null,
      },
      counts,
      missing_files: missingFiles,
    }

    archive.append(JSON.stringify(manifest, null, 2), {
      name: 'manifest.json',
    })

    if (creations.length) {
      archive.append(JSON.stringify({ creations }, null, 2), {
        name: 'creations.json',
      })
    }

    if (includeChats) {
      for (const session of sessions) {
        const messages = await Message.find({ session: session._id })
          .sort({ createdAt: 1 })
          .lean()
        counts.messages += messages.length

        const sessionPayload = {
          session,
          messages,
        }

        archive.append(JSON.stringify(sessionPayload, null, 2), {
          name: `sessions/${session._id}.json`,
        })
      }
    }

    if (includeMediaFiles && files.length) {
      for (const file of files) {
        if (missingFiles.includes(file.creationId)) {
          continue
        }
        const stream = server.s3
          .getObject({
            Bucket: bucket,
            Key: file.key,
          })
          .createReadStream()

        archive.append(stream, {
          name: `media/${file.creationId}.${file.extension}`,
        })
      }
    }

    await archive.finalize()
    await uploadPromise

    const archiveInfo = {
      bucket,
      key: exportKey,
      filename: exportFilename,
      size_bytes: archiveBytes,
      sha256: hash.digest('hex'),
      expires_at: expiresAt,
    }

    await markExportCompleted(server, exportDoc, archiveInfo, counts)
  } catch (error) {
    if (await isExportCancelled(exportId)) {
      await markExportCancelled(exportDoc)
      return
    }
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown export error'
    await markExportFailed(server, exportDoc, errorMessage)
  }
}

export const createExport = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const body = (request.body || {}) as CreateExportBody
  const includeChats =
    body.include_chats ?? DEFAULT_EXPORT_FILTERS.include_chats
  const includeMediaFiles =
    body.include_media_files ?? DEFAULT_EXPORT_FILTERS.include_media_files
  const mediaTypes = normalizeMediaTypes(body.media_types)
  const agentIds = buildAgentFilter(body.agent_ids)
  const { createdAfter, createdBefore } = resolveDateRange(body)

  if (createdAfter && createdBefore && createdAfter > createdBefore) {
    return reply.status(400).send({
      message: 'Invalid date range. Start date must be before end date.',
    })
  }

  if (!includeChats && mediaTypes.length === 0) {
    return reply.status(400).send({
      message: 'Select chats and/or at least one media type.',
    })
  }

  const activeCount = await DataExportV2.countDocuments({
    user: new ObjectId(userId),
    status: { $in: ['queued', 'running'] },
  })
  if (activeCount >= DATA_EXPORTS.MAX_ACTIVE_PER_USER) {
    return reply.status(429).send({
      message:
        'Too many active exports. Please wait for your current export to finish.',
    })
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentCount = await DataExportV2.countDocuments({
    user: new ObjectId(userId),
    createdAt: { $gte: dayAgo },
  })
  if (recentCount >= DATA_EXPORTS.MAX_PER_DAY_PER_USER) {
    return reply.status(429).send({
      message: 'Export limit reached for the last 24 hours. Try again later.',
    })
  }

  const exportDoc = await DataExportV2.create({
    user: new ObjectId(userId),
    status: 'queued',
    filters: {
      include_chats: includeChats,
      include_media_files: includeMediaFiles,
      media_types: mediaTypes,
      agent_ids: agentIds || [],
      created_after: createdAfter,
      created_before: createdBefore,
    },
    counts: {
      sessions: 0,
      messages: 0,
      creations: 0,
      files: 0,
      bytes: 0,
    },
  })

  setImmediate(() => {
    void processExport(server, exportDoc._id.toString())
  })

  return reply.status(200).send({ export: exportDoc })
}

export { estimateExport }

export const listExports = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const {
    status,
    limit = 20,
    offset = 0,
  } = (request.query || {}) as ListExportQuery

  const query: Record<string, any> = {
    user: new ObjectId(userId),
  }
  if (status) {
    query.status = status
  }

  const [exports, totalCount] = await Promise.all([
    DataExportV2.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    DataExportV2.countDocuments(query),
  ])

  return reply.status(200).send({
    exports,
    total_count: totalCount,
  })
}

export const getExport = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const { exportId } = request.params as { exportId: string }
  const exportDoc = await DataExportV2.findOne({
    _id: new ObjectId(exportId),
    user: new ObjectId(userId),
  }).lean()

  if (!exportDoc) {
    return reply.status(404).send({ message: 'Export not found' })
  }

  return reply.status(200).send({ export: exportDoc })
}

export const downloadExport = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const { exportId } = request.params as { exportId: string }
  const exportDoc = await DataExportV2.findOne({
    _id: new ObjectId(exportId),
    user: new ObjectId(userId),
  })

  if (!exportDoc) {
    return reply.status(404).send({ message: 'Export not found' })
  }

  if (exportDoc.status !== 'completed' || !exportDoc.archive) {
    return reply.status(409).send({
      message: 'Export is not ready for download yet.',
    })
  }

  if (exportDoc.expires_at && exportDoc.expires_at < nowUtc()) {
    exportDoc.status = 'expired'
    await exportDoc.save()
    return reply.status(410).send({
      message: 'Export has expired. Please generate a new export.',
    })
  }

  if (
    exportDoc.download_count &&
    exportDoc.download_count >= DATA_EXPORTS.MAX_DOWNLOADS_PER_EXPORT
  ) {
    return reply.status(429).send({
      message: 'Download limit reached for this export.',
    })
  }

  const signedUrl = server.s3.getSignedUrl('getObject', {
    Bucket: exportDoc.archive.bucket,
    Key: exportDoc.archive.key,
    ResponseContentType: 'application/zip',
    ResponseContentDisposition: `attachment; filename="${exportDoc.archive.filename}"`,
    Expires: DATA_EXPORTS.DOWNLOAD_URL_TTL_SECONDS,
  })

  exportDoc.download_count = (exportDoc.download_count || 0) + 1
  exportDoc.last_downloaded_at = nowUtc()
  await exportDoc.save()

  return reply.status(200).send({
    url: signedUrl,
    expires_in_seconds: DATA_EXPORTS.DOWNLOAD_URL_TTL_SECONDS,
  })
}

export const cancelExport = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.user?.userId
  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const { exportId } = request.params as { exportId: string }
  const exportDoc = await DataExportV2.findOne({
    _id: new ObjectId(exportId),
    user: new ObjectId(userId),
  })

  if (!exportDoc) {
    return reply.status(404).send({ message: 'Export not found' })
  }

  if (!['queued', 'running'].includes(exportDoc.status)) {
    return reply.status(409).send({
      message: `Cannot cancel an export in status ${exportDoc.status}.`,
    })
  }

  await markExportCancelled(exportDoc)

  return reply.status(200).send({
    exportId,
    status: exportDoc.status,
  })
}
