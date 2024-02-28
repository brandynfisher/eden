import { GeneratorDocument } from '../../models/Generator'
import { FastifyInstance } from 'fastify'

const makeWebhookUrl = (server: FastifyInstance) =>
  `${server.config.WEBHOOK_URL}/tasks/update?secret=${server.config.WEBHOOK_SECRET}`

const submitTask = async (
  server: FastifyInstance,
  generator: GeneratorDocument,
  generatorVersion: any,
  config: any,
) => {
  const { handleGeneratorRequest } = server
  if (!handleGeneratorRequest) {
    throw new Error('Logos not initialized')
  }
  const webhookUrl = makeWebhookUrl(server)

  const args = {
    generatorName: generator.generatorName,
    config: config,
    webhookUrl: webhookUrl,
  }

  const task = await handleGeneratorRequest(server, args)

  return task
}

const getTransactionCost = (
  _: FastifyInstance,
  __: any,
  ___: any,
  config: any,
) => 30

export { submitTask, getTransactionCost }
