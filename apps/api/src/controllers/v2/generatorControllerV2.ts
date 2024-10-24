import { GeneratorV2 } from '../../models/v2/GeneratorV2'
import {
  GeneratorsGetArgumentsV2,
  GeneratorsListArgumentsV2,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const getGenerator = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { generatorKey } = request.params as GeneratorsGetArgumentsV2

  const generator = await GeneratorV2.findOne(
    {
      key: generatorKey,
    },
    {
      'parameters.tip': 0,
    },
  )

  console.log({ generator })

  // nothing found or it was deleted and the user is not the owner
  if (!generator) {
    return reply.status(404).send({
      message: 'Tool not found',
    })
  }

  return reply.status(200).send({ generator })
}

export const listGenerators = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { hideParams } = request.query as GeneratorsListArgumentsV2
  const projection = hideParams
    ? {
        resolutions: 0,
        parameters: 0,
      }
    : {
        'parameters.tip': 0,
      }

  const generators = await GeneratorV2.find({}, projection)

  return reply.status(200).send({ generators })
}
