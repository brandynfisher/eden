import { CreationV2, CreationV2Document } from '../../models/v2/CreationV2'
import { s3ThumbnailUrl, s3Url } from '../../plugins/s3Plugin'
import {
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
      path: 'user',
      select: '_id userId username userImage',
    })) as CreationV2Document & {
    reactions?: Map<ReactionType, boolean>
    bookmarked?: boolean
  }

  // nothing found or it was deleted and the user is not the owner
  if (
    !creation ||
    (request.user?.userId &&
      creation.deleted &&
      creation.user._id.toString() !== request.user?.userId.toString())
  ) {
    return reply.status(404).send({
      message: 'Creation not found',
    })
  }

  if (!creation.public) {
    if (creation.user._id.toString() !== request.user?.userId.toString()) {
      console.error('User not authorized to view this')
      return reply.status(401).send({
        message: 'User not authorized to view this',
      })
    }
  }

  creation.url = s3Url(server, creation.url || '')
  creation.thumbnail = s3ThumbnailUrl(server, creation.thumbnail || '', 1024)

  return reply.status(200).send({ creation })
}

export const creationUpdate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { creationId } = request.params as CreationsV2PatchArguments
  const { public: isPublic } = request.body as CreationsV2PatchArguments

  if (!userId || !creationId || typeof isPublic === 'undefined') {
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

  await creation.save()

  await creation.populate({
    path: 'user',
    select: '_id username userId userImage',
  })

  return reply.status(200).send({
    creation,
  })
}
