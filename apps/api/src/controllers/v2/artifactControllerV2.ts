import { ArtifactV2, ArtifactV2Document } from '../../models/v2/ArtifactV2'
import {
  forceCloudfrontUrl,
  s3ThumbnailUrl,
  s3Url,
} from '../../plugins/s3Plugin'
import ArtifactV2Repository from '../../repositories/ArtifactV2Repository'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

interface ListArtifactsQuery {
  userId?: string
  type?: string
  agentId?: string
  sessionId?: string
  page?: number
  limit?: number
}

interface CreateArtifactBody {
  title: string
  type: string
  parent?: string
  agents?: string[]
  public?: boolean
  description?: string
  session?: string
  creations?: Array<{
    creation: string
    caption?: string
  }>
}

interface UpdateArtifactBody {
  title?: string
  type?: string
  parent?: string | null
  agents?: string[]
  public?: boolean
  description?: string
  session?: string | null
  creations?: Array<{
    creation: string
    caption?: string
  }>
  deleted?: boolean
}

export const listArtifacts = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  const {
    userId: filterUserId,
    type,
    agentId,
    sessionId,
    page = 1,
    limit = 20,
  } = request.query as ListArtifactsQuery

  const filter: any = {}

  // If filtering by specific user
  if (filterUserId) {
    filter.user = new ObjectId(filterUserId)
  }

  // If not the owner, only show public artifacts
  if (!userId || (filterUserId && filterUserId !== userId.toString())) {
    filter.public = true
  }

  if (type) {
    filter.type = type
  }

  if (agentId) {
    filter.agents = new ObjectId(agentId)
  }

  if (sessionId) {
    filter.session = new ObjectId(sessionId)
  }

  const artifactRepository = new ArtifactV2Repository(ArtifactV2)
  const result = await artifactRepository.query(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'user',
        select: '_id userId username userImage type',
        model: 'users3',
      },
      {
        path: 'agents',
        select: '_id username name userImage type',
        model: 'users3',
      },
      {
        path: 'parent',
        select: '_id title type',
      },
      {
        path: 'creations.creation',
        select: '_id filename url thumbnail mediaAttributes tool',
        model: 'creations3',
      },
    ],
  })

  // Add URLs for creations
  const docsWithUrls = result.docs.map((doc: any) => {
    const artifact = typeof doc.toObject === 'function' ? doc.toObject() : doc
    if (artifact.creations) {
      artifact.creations = artifact.creations.map((c: any) => {
        if (c.creation?.filename) {
          c.creation.url = s3Url(server, c.creation.filename)
          c.creation.thumbnail = s3ThumbnailUrl(
            server,
            c.creation.filename,
            512,
          )
        }
        return c
      })
    }
    if (artifact.user?.userImage) {
      artifact.user.userImage = forceCloudfrontUrl(
        server,
        artifact.user.userImage,
      )
    }
    return artifact
  })

  return reply.status(200).send({
    docs: docsWithUrls,
    total: result.total,
    limit: result.limit,
    pages: result.pages,
    page: result.page,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  })
}

export const getArtifact = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { artifactId } = request.params as { artifactId: string }
  const { userId } = request.user || {}

  const artifact = (await ArtifactV2.findOne({
    _id: artifactId,
    deleted: false,
  })
    .populate({
      path: 'user',
      select: '_id userId username userImage type',
      model: 'users3',
    })
    .populate({
      path: 'agents',
      select: '_id username name userImage type',
      model: 'users3',
    })
    .populate({
      path: 'parent',
      select: '_id title type',
    })
    .populate({
      path: 'creations.creation',
      select: '_id filename url thumbnail mediaAttributes tool args',
      model: 'creations3',
    })) as ArtifactV2Document | null

  if (!artifact) {
    return reply.status(404).send({
      message: 'Artifact not found',
    })
  }

  // Check access
  const artifactObj = artifact.toObject() as any
  if (
    !artifactObj.public &&
    (!userId || artifactObj.user._id.toString() !== userId.toString())
  ) {
    return reply.status(401).send({
      message: 'Not authorized to view this artifact',
    })
  }

  // Add URLs for creations
  if (artifactObj.creations) {
    artifactObj.creations = artifactObj.creations.map((c: any) => {
      if (c.creation?.filename) {
        c.creation.url = s3Url(server, c.creation.filename)
        c.creation.thumbnail = s3ThumbnailUrl(server, c.creation.filename, 512)
      }
      return c
    })
  }
  if (artifactObj.user?.userImage) {
    artifactObj.user.userImage = forceCloudfrontUrl(
      server,
      artifactObj.user.userImage,
    )
  }

  return reply.status(200).send({ artifact: artifactObj })
}

export const createArtifact = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(401).send({
      message: 'Authentication required',
    })
  }

  const body = request.body as CreateArtifactBody

  if (!body.title || !body.type) {
    return reply.status(422).send({
      message: 'Title and type are required',
    })
  }

  const artifactData: any = {
    user: new ObjectId(userId),
    title: body.title,
    type: body.type,
    public: body.public ?? true,
    description: body.description,
    agents: body.agents?.map(id => new ObjectId(id)) || [],
    creations:
      body.creations?.map(c => ({
        creation: new ObjectId(c.creation),
        caption: c.caption,
      })) || [],
  }

  if (body.parent) {
    artifactData.parent = new ObjectId(body.parent)
  }

  if (body.session) {
    artifactData.session = new ObjectId(body.session)
  }

  const artifact = await ArtifactV2.create(artifactData)

  await artifact.populate({
    path: 'user',
    select: '_id userId username userImage type',
    model: 'users3',
  })
  await artifact.populate({
    path: 'agents',
    select: '_id username name userImage type',
    model: 'users3',
  })
  await artifact.populate({
    path: 'creations.creation',
    select: '_id filename url thumbnail mediaAttributes tool',
    model: 'creations3',
  })

  const artifactObj = artifact.toObject() as any
  if (artifactObj.creations) {
    artifactObj.creations = artifactObj.creations.map((c: any) => {
      if (c.creation?.filename) {
        c.creation.url = s3Url(server, c.creation.filename)
        c.creation.thumbnail = s3ThumbnailUrl(server, c.creation.filename, 512)
      }
      return c
    })
  }

  return reply.status(201).send({ artifact: artifactObj })
}

export const updateArtifact = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(401).send({
      message: 'Authentication required',
    })
  }

  const { artifactId } = request.params as { artifactId: string }
  const body = request.body as UpdateArtifactBody

  const artifact = await ArtifactV2.findOne({
    _id: artifactId,
    user: userId,
  })

  if (!artifact) {
    return reply.status(404).send({
      message: 'Artifact not found',
    })
  }

  // Check subscription for making private
  if (body.public === false) {
    const user = request.user
    if (user.subscriptionTier === SubscriptionTier.Free) {
      return reply.status(401).send({
        message: 'Upgrade required to make artifacts private',
      })
    }
  }

  // Update fields
  if (body.title !== undefined) artifact.title = body.title
  if (body.type !== undefined) artifact.type = body.type
  if (body.description !== undefined) artifact.description = body.description
  if (body.public !== undefined) artifact.public = body.public
  if (body.deleted !== undefined) artifact.deleted = body.deleted

  if (body.parent !== undefined) {
    artifact.parent = body.parent ? new ObjectId(body.parent) : undefined
  }

  if (body.session !== undefined) {
    artifact.session = body.session ? new ObjectId(body.session) : undefined
  }

  if (body.agents !== undefined) {
    artifact.agents = body.agents.map(id => new ObjectId(id))
  }

  if (body.creations !== undefined) {
    artifact.creations = body.creations.map(c => ({
      creation: new ObjectId(c.creation),
      caption: c.caption,
    }))
  }

  await artifact.save()

  await artifact.populate({
    path: 'user',
    select: '_id userId username userImage type',
    model: 'users3',
  })
  await artifact.populate({
    path: 'agents',
    select: '_id username name userImage type',
    model: 'users3',
  })
  await artifact.populate({
    path: 'creations.creation',
    select: '_id filename url thumbnail mediaAttributes tool',
    model: 'creations3',
  })

  const artifactObj = artifact.toObject() as any
  if (artifactObj.creations) {
    artifactObj.creations = artifactObj.creations.map((c: any) => {
      if (c.creation?.filename) {
        c.creation.url = s3Url(server, c.creation.filename)
        c.creation.thumbnail = s3ThumbnailUrl(server, c.creation.filename, 512)
      }
      return c
    })
  }

  return reply.status(200).send({ artifact: artifactObj })
}

export const deleteArtifact = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(401).send({
      message: 'Authentication required',
    })
  }

  const { artifactId } = request.params as { artifactId: string }

  const artifact = await ArtifactV2.findOne({
    _id: artifactId,
    user: userId,
  })

  if (!artifact) {
    return reply.status(404).send({
      message: 'Artifact not found',
    })
  }

  artifact.deleted = true
  await artifact.save()

  return reply.status(200).send({
    message: 'Artifact deleted successfully',
  })
}

export const addCreationToArtifact = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(401).send({
      message: 'Authentication required',
    })
  }

  const { artifactId } = request.params as { artifactId: string }
  const { creationId, caption } = request.body as {
    creationId: string
    caption?: string
  }

  const artifact = await ArtifactV2.findOne({
    _id: artifactId,
    user: userId,
  })

  if (!artifact) {
    return reply.status(404).send({
      message: 'Artifact not found',
    })
  }

  // Check if creation already exists in artifact
  const exists = artifact.creations.some(
    c => c.creation.toString() === creationId,
  )

  if (exists) {
    return reply.status(400).send({
      message: 'Creation already in artifact',
    })
  }

  artifact.creations.push({
    creation: new ObjectId(creationId),
    caption,
  })

  await artifact.save()

  await artifact.populate({
    path: 'creations.creation',
    select: '_id filename url thumbnail mediaAttributes tool',
    model: 'creations3',
  })

  const artifactObj = artifact.toObject() as any
  if (artifactObj.creations) {
    artifactObj.creations = artifactObj.creations.map((c: any) => {
      if (c.creation?.filename) {
        c.creation.url = s3Url(server, c.creation.filename)
        c.creation.thumbnail = s3ThumbnailUrl(server, c.creation.filename, 512)
      }
      return c
    })
  }

  return reply.status(200).send({ artifact: artifactObj })
}

export const removeCreationFromArtifact = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(401).send({
      message: 'Authentication required',
    })
  }

  const { artifactId, creationId } = request.params as {
    artifactId: string
    creationId: string
  }

  const artifact = await ArtifactV2.findOne({
    _id: artifactId,
    user: userId,
  })

  if (!artifact) {
    return reply.status(404).send({
      message: 'Artifact not found',
    })
  }

  const index = artifact.creations.findIndex(
    c => c.creation.toString() === creationId,
  )

  if (index === -1) {
    return reply.status(404).send({
      message: 'Creation not found in artifact',
    })
  }

  artifact.creations.splice(index, 1)
  await artifact.save()

  return reply.status(200).send({
    message: 'Creation removed from artifact',
  })
}
