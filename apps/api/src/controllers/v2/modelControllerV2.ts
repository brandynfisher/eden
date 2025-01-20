import { User } from '../../models/User'
import { ModelV2 } from '../../models/v2/ModelV2'
import { s3ThumbnailUrl } from '../../plugins/s3Plugin'
import ModelV2Repository from '../../repositories/ModelV2Repository'
import {
  ModelsV2GetArguments,
  ModelsV2ListArguments,
  ModelsV2PatchArguments,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const listModels = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

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
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { modelId } = request.params as ModelsV2GetArguments

  const model = await ModelV2.findOneWithDeleted({
    _id: modelId,
  })
    .populate({
      path: 'user',
      select: '_id userId username userImage',
    })
    .populate({
      path: 'task',
      select: '_id args',
    })

  if (!model) {
    return reply.status(404).send({
      message: 'Model not found',
    })
  }

  const isOwner = model.user._id.toString() === request.user?.userId.toString()

  if (!isOwner && !model.public) {
    return reply.status(401).send({
      message: 'User not authorized to view this',
    })
  }

  if (!isOwner && model?.task?.args) {
    delete model.task.args.lora_training_urls
  }

  model.thumbnail = s3ThumbnailUrl(server, model.thumbnail || '', 1024)

  return reply.status(200).send({ model })
}

export const modelUpdate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { modelId } = request.params as ModelsV2PatchArguments
  const { public: isPublic, deleted } = request.body as ModelsV2PatchArguments

  if (
    !userId ||
    !modelId ||
    (typeof isPublic === 'undefined' && typeof deleted === 'undefined')
  ) {
    return reply.status(422).send({
      message: 'Missing parameters or malformed request body',
    })
  }

  const model = await ModelV2.findOne({
    _id: modelId,
    user: userId,
  })

  if (!model) {
    return reply.status(404).send({
      message: 'Model not found',
    })
  }

  if (typeof isPublic !== 'undefined') {
    model.public = isPublic
  }

  if (typeof deleted !== 'undefined') {
    model.deleted = deleted
  }

  await model.save()

  await model.populate({
    path: 'user',
    select: '_id username userId userImage',
  })

  return reply.status(200).send({
    model,
  })
}
