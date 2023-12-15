import { Assistant, Interaction } from '@edenlabs/eden-sdk'
import { FastifyInstance } from 'fastify'

import { dummyTaskHandlers } from '../lib/taskHandlers/dummy'
import { GeneratorDocument, GeneratorVersionSchema } from '../models/Generator'

export interface LogosResponse {
  message: string
  config?: any
}

export interface TaskHandlers {
  submitTask: (
    server: FastifyInstance,
    generator: GeneratorDocument,
    generatorVersion: GeneratorVersionSchema,
    config: any,
  ) => Promise<string | undefined>
  receiveTaskUpdate: (server: FastifyInstance, update: any) => void
  getTransactionCost: (
    server: FastifyInstance,
    generator: GeneratorDocument,
    generatorVersion: GeneratorVersionSchema,
    config: any,
  ) => number
}

export const registerTaskHandlers = (
  server: FastifyInstance,
  taskHandlers: TaskHandlers | undefined,
) => {
  const handlers = taskHandlers || dummyTaskHandlers
  server.decorate('submitTask', handlers.submitTask)
  server.decorate('receiveTaskUpdate', handlers.receiveTaskUpdate)
  server.decorate('getTransactionCost', handlers.getTransactionCost)
}

declare module 'fastify' {
  interface FastifyInstance {
    submitTask: (
      server: FastifyInstance,
      generator: GeneratorDocument,
      generatorVersion: GeneratorVersionSchema,
      config: any,
    ) => Promise<string>
    receiveTaskUpdate: (server: FastifyInstance, update: any) => void
    getTransactionCost: (
      server: FastifyInstance,
      generator: GeneratorDocument,
      generatorVersion: GeneratorVersionSchema,
      config: any,
    ) => number
    handleInteraction: (
      server: FastifyInstance,
      assistant: Assistant,
      interaction: Interaction,
    ) => Promise<LogosResponse>
  }
}
