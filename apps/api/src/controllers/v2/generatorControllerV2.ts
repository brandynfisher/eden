import { GeneratorsGetArgumentsV2 } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const getGenerator = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { generatorKey } = request.params as GeneratorsGetArgumentsV2

  if (!server.generatorConfigs) {
    return reply.status(500).send({
      message: `No generators configured`,
    })
  }

  const generatorConfig = server.generatorConfigs.find(
    generator => generator.key === generatorKey,
  )

  if (!generatorConfig) {
    return reply.status(404).send({
      message: `Generator '${generatorKey}' not found`,
    })
  }

  return reply.status(200).send({ generator: generatorConfig })
}

export const listGenerators = async (
  server: FastifyInstance,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!server.generatorConfigs) {
    return reply.status(500).send({
      message: `No generators configured`,
    })
  }

  return reply.status(200).send({ generators: server.generatorConfigs })
}
