import { User } from '../../models/Creator'
import { ModelV2 } from '../../models/v2/ModelV2'
import ModelV2Repository from '../../repositories/ModelV2Repository'
import { ModelsV2GetArguments, ModelsV2ListArguments } from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

export const listModels = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { modelId, limit, page, sort } = request.query as ModelsV2ListArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const modelsRepository = new ModelV2Repository(ModelV2)

  const query: ModelsV2ListArguments = {
    // user: user._id.toString(),
    // createdAt: {
    //   $gte: new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000)),
    // },
    // ...typeQuery,
  }

  if (modelId) {
    query.modelId = modelId
  }

  const models = await modelsRepository.query(query, {
    select: '-args.lora_training_urls',
    limit,
    page,
    sort: {
      ...sort,
      createdAt: -1,
    },
  })

  return reply.status(200).send(models)
}

export const getModel = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { modelId } = request.params as ModelsV2GetArguments

  const model = await ModelV2.findOneWithDeleted({
    _id: modelId,
  })
    .select('-args.lora_training_urls')
    .populate({
      path: 'user',
      select: '_id userId username userImage',
    })

  console.log({ model })

  // nothing found or it was deleted and the user is not the owner
  if (
    !model ||
    (request.user?.userId &&
      model.deleted &&
      model.user._id.toString() !== request.user?.userId.toString())
  ) {
    return reply.status(404).send({
      message: 'Model not found',
    })
  }

  if (model.user._id.toString() !== request.user?.userId.toString()) {
    if (!model.public) {
      console.error('User not authorized to view this')
      return reply.status(401).send({
        message: 'User not authorized to view this',
      })
    }
  }

  return reply.status(200).send({ model })
}
