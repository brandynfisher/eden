import {
  DATA_EXPORTS,
  DEFAULT_EXPORT_FILTERS,
} from '../../constants/exportConstants'
import { Agent } from '../../models/Agent'
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

type ExportMediaFile = {
  key: string
  creationId: string
  fileSize?: number
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
        .select({ _id: 1, filename: 1, url: 1, 'mediaAttributes.fileSize': 1 })
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
            fileSize: creation.mediaAttributes?.fileSize,
          }
        })
        .filter(Boolean) as ExportMediaFile[])
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
  let missingFiles: string[] = []
  if (includeMediaFiles && files.length) {
    const bucket = server.config.AWS_S3_BUCKET
    if (!bucket) {
      return reply.status(500).send({
        message: 'Storage not configured for exports.',
      })
    }
    const sizeResult = await sumExportFileSizes(server, bucket, files)
    totalBytes = sizeResult.totalBytes
    missingFiles = sizeResult.missingFiles
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

const sumExportFileSizes = async <T extends ExportMediaFile>(
  server: FastifyInstance,
  bucket: string,
  files: T[],
) => {
  let totalBytes = 0
  const missingFiles: string[] = []
  const missingSizeFiles: T[] = []

  for (const file of files) {
    const size = file.fileSize
    if (typeof size === 'number' && Number.isFinite(size)) {
      totalBytes += size
    } else {
      missingSizeFiles.push(file)
    }
  }

  if (!missingSizeFiles.length) {
    return { totalBytes, missingFiles }
  }

  const limit = pLimit(DATA_EXPORTS.HEAD_CONCURRENCY)
  const sizes = await Promise.all(
    missingSizeFiles.map(file =>
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

  totalBytes += sizes.reduce((sum, size) => sum + size, 0)
  return { totalBytes, missingFiles }
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const safeJsonStringify = (value: unknown) => {
  try {
    return JSON.stringify(
      value,
      (_key, val) => (typeof val === 'bigint' ? val.toString() : val),
      2,
    )
  } catch {
    return String(value)
  }
}

const formatTimestamp = (value?: Date | string | null) => {
  if (!value) {
    return ''
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString()
}

const formatAttachmentName = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  const lastPart = trimmed.split('/').pop()
  return lastPart || trimmed
}

const buildToolMessageMap = (messages: any[]) => {
  const map = new Map<string, any>()
  for (const message of messages) {
    if (message?.role !== 'tool') {
      continue
    }
    const key = message.tool_call_id || message.name
    if (key) {
      map.set(key, message)
    }
  }
  return map
}

const hydrateAgentNames = async (
  agentIds: string[],
  agentNameMap: Map<string, string>,
) => {
  const uniqueIds = Array.from(new Set(agentIds)).filter(id => id)
  const pendingIds = uniqueIds.filter(
    id => !agentNameMap.has(id) && ObjectId.isValid(id),
  )
  if (!pendingIds.length) {
    return
  }

  const agents = await Agent.find({
    _id: { $in: pendingIds.map(id => new ObjectId(id)) },
  })
    .select({ _id: 1, name: 1 })
    .lean()

  for (const agent of agents) {
    agentNameMap.set(agent._id.toString(), agent.name || 'Assistant')
  }
}

const resolveMessageRoleLabel = (
  message: any,
  agentNameMap: Map<string, string>,
) => {
  const role = message?.role || 'user'
  if (role === 'assistant') {
    const senderId = message?.sender ? String(message.sender) : ''
    return agentNameMap.get(senderId) || 'Assistant'
  }
  if (role === 'user') {
    return 'User'
  }
  return String(role).toUpperCase()
}

const resolveSenderNameSuffix = (message: any) => {
  const senderName = message?.sender_name
  if (!senderName || typeof senderName !== 'string') {
    return ''
  }
  const trimmed = senderName.trim()
  if (!trimmed) {
    return ''
  }
  return ` - ${trimmed}`
}

const buildToolCallHtml = (toolCall: any, toolMessage?: any) => {
  const toolName = toolCall?.tool || toolCall?.name || 'tool'
  const status = toolCall?.status || 'pending'
  const args = toolCall?.args
  let result = toolCall?.result
  let error = toolCall?.error
  let statusOverride = toolCall?.status

  if (toolMessage?.content) {
    try {
      const parsed = JSON.parse(toolMessage.content)
      if (parsed && typeof parsed === 'object') {
        if (parsed.result !== undefined) {
          result = parsed.result
        }
        if (parsed.error) {
          error = parsed.error
        }
        if (parsed.status) {
          statusOverride = parsed.status
        }
      }
    } catch {
      // Keep fallback content below.
      if (!result) {
        result = toolMessage.content
      }
    }
  }

  const statusClass = `status-${String(statusOverride || status)}`
  const html: string[] = []
  html.push('<div class="tool-call">')
  html.push(`<span class="tool-name">${escapeHtml(String(toolName))}</span>`)
  html.push(
    `<span class="tool-status ${escapeHtml(statusClass)}">${escapeHtml(
      String(statusOverride || status),
    )}</span>`,
  )
  if (args && Object.keys(args).length) {
    html.push(
      `<div>Args: <pre>${escapeHtml(safeJsonStringify(args))}</pre></div>`,
    )
  }
  if (error) {
    html.push(
      `<div class="tool-error">Error: ${escapeHtml(String(error))}</div>`,
    )
  }
  if (result !== undefined) {
    const resultString =
      typeof result === 'string' ? result : safeJsonStringify(result)
    html.push(
      `<div class="tool-result"><pre>${escapeHtml(resultString)}</pre></div>`,
    )
  }
  html.push('</div>')
  return html.join('')
}

const renderSessionSection = (
  session: any,
  messages: any[],
  options: {
    exportId: string
    frontendUrl?: string | null
    agentNameMap: Map<string, string>
  },
) => {
  const sessionTitle = session?.title || 'Untitled Session'
  const createdAt = formatTimestamp(session?.createdAt)
  const updatedAt = formatTimestamp(session?.updatedAt)
  const sessionId = session?._id?.toString() || ''
  const frontendUrl = options.frontendUrl
    ? options.frontendUrl.replace(/\/+$/, '')
    : null
  const sessionLink = frontendUrl ? `${frontendUrl}/sessions/${sessionId}` : ''
  const toolMessageMap = buildToolMessageMap(messages)

  const html: string[] = []
  html.push('<div class="session">')
  html.push('<div class="session-header">')
  if (sessionLink) {
    html.push(
      `<div class="session-title"><a href="${escapeHtml(
        sessionLink,
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
        String(sessionTitle),
      )}</a></div>`,
    )
  } else {
    html.push(
      `<div class="session-title">${escapeHtml(String(sessionTitle))}</div>`,
    )
  }
  html.push(
    `<div class="session-meta">Session ID: ${escapeHtml(String(sessionId))}${
      createdAt ? ` | Created: ${escapeHtml(createdAt)}` : ''
    }${updatedAt ? ` | Updated: ${escapeHtml(updatedAt)}` : ''}</div>`,
  )
  html.push(
    `<div class="session-meta">Export ID: ${escapeHtml(
      String(options.exportId),
    )}</div>`,
  )
  html.push('</div>')

  const visibleMessages = messages.filter(
    message => !['eden', 'tool'].includes(message?.role),
  )

  if (!visibleMessages.length) {
    html.push('<div class="message">No messages in this session.</div>')
  }

  for (const message of visibleMessages) {
    const role = message?.role || 'user'
    const roleClass = `message-${role}`
    const content = message?.content || ''
    const timestamp = formatTimestamp(message?.createdAt)
    const toolCalls = Array.isArray(message?.tool_calls)
      ? message.tool_calls
      : []
    const roleLabel = resolveMessageRoleLabel(message, options.agentNameMap)
    const senderSuffix = resolveSenderNameSuffix(message)

    html.push(`<div class="message ${escapeHtml(roleClass)}">`)
    html.push('<div class="message-header">')
    html.push(
      `<span>${escapeHtml(String(roleLabel))}${escapeHtml(
        senderSuffix,
      )}</span>`,
    )
    if (timestamp) {
      html.push(`<span class="timestamp">${escapeHtml(timestamp)}</span>`)
    }
    html.push('</div>')
    html.push(`<div class="message-content">${escapeHtml(content)}</div>`)

    if (Array.isArray(message?.attachments) && message.attachments.length) {
      html.push('<div class="attachments"><strong>Attachments:</strong><br />')
      for (const attachment of message.attachments) {
        const name = formatAttachmentName(String(attachment))
        html.push(
          `<a class="attachment-link" href="${escapeHtml(
            String(attachment),
          )}">${escapeHtml(name || String(attachment))}</a>`,
        )
      }
      html.push('</div>')
    }

    if (toolCalls.length) {
      html.push('<div class="tool-calls"><strong>Tool Calls:</strong>')
      for (const toolCall of toolCalls) {
        const toolCallId =
          toolCall?.id || toolCall?.tool_call_id || toolCall?.name
        const toolMessage = toolCallId
          ? toolMessageMap.get(toolCallId)
          : undefined
        html.push(buildToolCallHtml(toolCall, toolMessage))
      }
      html.push('</div>')
    }

    html.push('</div>')
  }

  return html.join('')
}

const buildHtmlShell = (title: string, bodyContent: string) => {
  const html: string[] = []
  html.push('<!DOCTYPE html>')
  html.push('<html lang="en">')
  html.push('<head>')
  html.push('<meta charset="UTF-8" />')
  html.push(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  )
  html.push(`<title>${escapeHtml(title)}</title>`)
  html.push('<style>')
  html.push(`
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #1f2933; max-width: 960px; margin: 0 auto; padding: 24px; background: #f5f7fa; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .session { background: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
    .session-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; }
    .session-title { font-size: 1.4rem; font-weight: 700; color: #0f172a; }
    .session-meta { font-size: 0.9rem; color: #6b7280; margin-top: 4px; }
    .message { margin-bottom: 16px; padding: 16px; border-radius: 10px; background: #f8fafc; }
    .message-user { background: #e0f2fe; }
    .message-assistant { background: #f8fafc; }
    .message-system { background: #fff7ed; }
    .message-header { font-weight: 600; margin-bottom: 8px; color: #334155; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .message-content { white-space: pre-wrap; word-wrap: break-word; }
    .timestamp { color: #94a3b8; font-size: 0.85rem; }
    .attachments { margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; }
    .attachment-link { display: inline-block; margin-right: 10px; margin-bottom: 6px; color: #2563eb; text-decoration: none; }
    .attachment-link:hover { text-decoration: underline; }
    .tool-calls { margin-top: 12px; padding: 12px; background: #f1f5f9; border-radius: 8px; }
    .tool-call { margin-top: 8px; padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; }
    .tool-name { font-weight: 600; color: #0f172a; }
    .tool-status { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; font-size: 0.8rem; background: #e2e8f0; color: #334155; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .status-pending { background: #fef9c3; color: #92400e; }
    .tool-result pre, .tool-call pre { margin: 8px 0 0 0; padding: 10px; background: #f8fafc; border-radius: 6px; overflow-x: auto; }
    .tool-error { color: #b91c1c; margin-top: 6px; }
  `)
  html.push('</style>')
  html.push('</head>')
  html.push('<body>')
  html.push(bodyContent)
  html.push('</body>')
  html.push('</html>')
  return html.join('')
}

const buildSessionHtml = (
  session: any,
  messages: any[],
  options: {
    exportId: string
    frontendUrl?: string | null
    agentNameMap: Map<string, string>
  },
) => {
  const body = renderSessionSection(session, messages, options)
  return buildHtmlShell(`Eden Export - ${session?.title || 'Session'}`, body)
}

const buildSessionsIndexHtml = (
  sessions: Array<{ id: string; title: string; createdAt?: Date | string }>,
  exportId: string,
  frontendUrl?: string | null,
) => {
  const normalizedUrl = frontendUrl ? frontendUrl.replace(/\/+$/, '') : ''
  const html: string[] = []
  html.push('<!DOCTYPE html>')
  html.push('<html lang="en">')
  html.push('<head>')
  html.push('<meta charset="UTF-8" />')
  html.push(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  )
  html.push('<title>Eden Export Sessions</title>')
  html.push('<style>')
  html.push(`
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #1f2933; max-width: 960px; margin: 0 auto; padding: 24px; background: #f5f7fa; }
    h1 { font-size: 1.8rem; margin-bottom: 8px; }
    ul { list-style: none; padding: 0; }
    li { background: #ffffff; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    a { color: #2563eb; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
    .meta { color: #6b7280; font-size: 0.9rem; margin-top: 4px; }
  `)
  html.push('</style>')
  html.push('</head>')
  html.push('<body>')
  html.push('<h1>Session Export</h1>')
  html.push(`<div class="meta">Export ID: ${escapeHtml(exportId)}</div>`)
  html.push(
    '<div class="meta"><a href="./all.html">View all sessions</a></div>',
  )
  html.push('<ul>')
  for (const session of sessions) {
    const createdAt = formatTimestamp(session.createdAt)
    const appLink = normalizedUrl
      ? `${normalizedUrl}/sessions/${session.id}`
      : ''
    html.push('<li>')
    html.push(
      `<a href="./${escapeHtml(session.id)}.html">${escapeHtml(
        session.title || session.id,
      )}</a>`,
    )
    html.push(
      `<div class="meta">Session ID: ${escapeHtml(session.id)}${
        createdAt ? ` | Created: ${escapeHtml(createdAt)}` : ''
      }</div>`,
    )
    if (appLink) {
      html.push(
        `<div class="meta"><a href="${escapeHtml(
          appLink,
        )}" target="_blank" rel="noopener noreferrer">Open in Eden</a></div>`,
      )
    }
    html.push('</li>')
  }
  html.push('</ul>')
  html.push('</body>')
  html.push('</html>')
  return html.join('')
}

const buildAllSessionsHtml = (
  sessions: Array<{
    session: any
    messages: any[]
  }>,
  exportId: string,
  frontendUrl: string | null,
  agentNameMap: Map<string, string>,
) => {
  const sections: string[] = []
  sections.push('<h1>All Sessions</h1>')
  sections.push(
    `<div class="session-meta">Export ID: ${escapeHtml(exportId)}</div>`,
  )
  for (const entry of sessions) {
    sections.push(
      renderSessionSection(entry.session, entry.messages, {
        exportId,
        frontendUrl,
        agentNameMap,
      }),
    )
  }
  return buildHtmlShell('Eden Export - All Sessions', sections.join(''))
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
              fileSize: creation.mediaAttributes?.fileSize,
            }
          })
          .filter(Boolean) as {
          key: string
          creationId: string
          extension: string
          fileSize?: number
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
    let missingFiles: string[] = []
    if (includeMediaFiles && files.length) {
      const sizeResult = await sumExportFileSizes(server, bucket, files)
      totalBytes = sizeResult.totalBytes
      missingFiles = sizeResult.missingFiles
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
      const frontendUrl = server.config.EDEN2_FRONTEND_URL || null
      const agentNameMap = new Map<string, string>()
      const sessionIndex: Array<{
        id: string
        title: string
        createdAt?: Date | string
      }> = []
      const allSessionHtmlPayload: Array<{
        session: any
        messages: any[]
      }> = []

      for (const session of sessions) {
        const messages = await Message.find({ session: session._id })
          .sort({ createdAt: 1 })
          .lean()
        counts.messages += messages.length

        const agentIds = messages
          .filter(message => message?.role === 'assistant' && message?.sender)
          .map(message => String(message.sender))
        await hydrateAgentNames(agentIds, agentNameMap)

        const sessionPayload = {
          session,
          messages,
        }

        archive.append(JSON.stringify(sessionPayload, null, 2), {
          name: `sessions/${session._id}.json`,
        })

        const sessionHtml = buildSessionHtml(session, messages, {
          exportId,
          frontendUrl,
          agentNameMap,
        })
        archive.append(sessionHtml, {
          name: `sessions/${session._id}.html`,
        })

        sessionIndex.push({
          id: session._id?.toString() || '',
          title: session.title || 'Untitled Session',
          createdAt: session.createdAt,
        })

        allSessionHtmlPayload.push({
          session,
          messages,
        })
      }

      if (sessionIndex.length) {
        const indexHtml = buildSessionsIndexHtml(
          sessionIndex,
          exportId,
          frontendUrl,
        )
        archive.append(indexHtml, {
          name: 'sessions/index.html',
        })

        const allSessionsHtml = buildAllSessionsHtml(
          allSessionHtmlPayload,
          exportId,
          frontendUrl,
          agentNameMap,
        )
        archive.append(allSessionsHtml, {
          name: 'sessions/all.html',
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
