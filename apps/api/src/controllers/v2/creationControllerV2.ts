import { CreationV2, CreationV2Document } from '../../models/v2/CreationV2'
import { s3ThumbnailUrl, s3Url } from '../../plugins/s3Plugin'
import {
  CreationsV2BulkPatchArguments,
  CreationsV2GetArguments,
  CreationsV2PatchArguments,
  ReactionType,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const getCreation = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { creationId } = request.params as CreationsV2GetArguments

  const creation = (await CreationV2.findOneWithDeleted({
    _id: creationId,
  })
    // .populate({
    //   path: 'concept',
    //   select: '_id name user conceptName creationCount thumbnail',
    // })
    .populate({
      path: 'task',
      select: '_id args',
    })
    .populate({
      path: 'user',
      select: '_id userId username userImage',
    })) as CreationV2Document & {
    reactions?: Map<ReactionType, boolean>
    bookmarked?: boolean
  }

  if (!creation || creation.deleted) {
    return reply.status(404).send({
      message: 'Creation not found',
    })
  }

  console.log({ creation })

  if (!creation.public) {
    if (creation.user._id.toString() !== request.user?.userId.toString()) {
      console.error('User not authorized to view this')
      return reply.status(401).send({
        message: 'User not authorized to view this',
      })
    }
  }

  creation.url = s3Url(server, creation.filename || '')
  creation.thumbnail = s3ThumbnailUrl(server, creation.filename || '', 1024)

  return reply.status(200).send({ creation })
}

export const creationUpdate = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { creationId } = request.params as CreationsV2PatchArguments
  const { public: isPublic, deleted } =
    request.body as CreationsV2PatchArguments

  if (
    !userId ||
    !creationId ||
    (typeof isPublic === 'undefined' && typeof deleted === 'undefined')
  ) {
    return reply.status(422).send({
      message: 'Missing parameters or malformed request body',
    })
  }

  const creation = await CreationV2.findOne({
    _id: creationId,
    user: userId,
  })

  if (!creation) {
    return reply.status(404).send({
      message: 'Creation not found',
    })
  }

  if (typeof isPublic !== 'undefined') {
    creation.public = isPublic
  }

  if (typeof deleted !== 'undefined') {
    creation.deleted = deleted
  }

  await creation.save()

  await creation.populate({
    path: 'user',
    select: '_id username userId userImage',
  })
  await creation.populate({
    path: 'task',
    select: '_id args',
  })

  creation.url = s3Url(server, creation.filename || '')
  creation.thumbnail = s3ThumbnailUrl(server, creation.filename || '', 1024)

  return reply.status(200).send({
    creation,
  })
}

interface UpdateResult {
  creationId: string
  status: 'success' | 'failed'
  creation?: any // Replace 'any' with your creation type
  error?: string
}

export const creationBulkUpdate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const {
    creationIds,
    public: isPublic,
    deleted,
  } = request.body as CreationsV2BulkPatchArguments

  if (
    !userId ||
    !creationIds ||
    !Array.isArray(creationIds) ||
    creationIds.length === 0 ||
    (typeof isPublic === 'undefined' && typeof deleted === 'undefined')
  ) {
    return reply.status(422).send({
      message: 'Missing parameters or malformed request body',
    })
  }

  const results: UpdateResult[] = []

  for (const creationId of creationIds) {
    try {
      // Find the creation belonging to the user
      const creation = await CreationV2.findOne({
        _id: creationId,
        user: userId,
      })

      if (!creation) {
        // If creation not found, record the failure
        results.push({
          creationId,
          status: 'failed',
          error: 'Creation not found',
        })
        continue // Proceed to the next creationId
      }

      // Update the fields if they are provided
      if (typeof isPublic !== 'undefined') {
        creation.public = isPublic
      }

      if (typeof deleted !== 'undefined') {
        creation.deleted = deleted
      }

      // Save the updated creation
      await creation.save()

      // Populate the 'user' field as needed
      await creation.populate({
        path: 'user',
        select: '_id username userId userImage',
      })

      await creation.populate({
        path: 'task',
        select: '_id args',
      })

      // Record the successful update
      results.push({
        creationId,
        status: 'success',
        creation, // Optionally include the updated creation data
      })
    } catch (error: any) {
      // Handle any unexpected errors during the update process
      results.push({
        creationId,
        status: 'failed',
        error: error.message || 'An unexpected error occurred',
      })
    }
  }

  // **4. Send the Response with All Results**
  return reply.status(200).send({
    results,
  })
}
