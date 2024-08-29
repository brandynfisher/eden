import {
  CreationV2Document,
  CreationV2 as CreationV2Model,
} from '../../models/v2/CreationV2'
import { s3ThumbnailUrl, s3Url } from '../../plugins/s3Plugin'
import { CreationsV2GetArguments, ReactionType } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const getCreation = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { creationId } = request.params as CreationsV2GetArguments

  const creation = (await CreationV2Model.findOneWithDeleted({
    _id: creationId,
  })
    // .populate({
    //   path: 'task',
    //   select: 'config status generator',
    //   populate: {
    //     path: 'generator',
    //     select: 'generatorName description output',
    //   },
    // })
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
