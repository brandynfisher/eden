import { InteractionEvent, SessionEventType } from '@edenlabs/eden-sdk'
import { FastifyInstance } from 'fastify'

import { dummyTaskHandlers } from '../lib/taskHandlers/dummy'
import { GeneratorDocument, GeneratorVersionSchema } from '../models/Generator'

export interface LogosResponse {
  type: SessionEventType
  data: {
    message?: string
    creations?: {
      uri: string
    }[]
  }
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
  handleInteraction: (
    server: FastifyInstance,
    interaction: InteractionEvent,
  ) => Promise<LogosResponse>
}

export const registerTaskHandlers = (
  server: FastifyInstance,
  taskHandlers: TaskHandlers | undefined,
) => {
  const handlers = taskHandlers || dummyTaskHandlers
  server.decorate('submitTask', handlers.submitTask)
  server.decorate('receiveTaskUpdate', handlers.receiveTaskUpdate)
  server.decorate('getTransactionCost', handlers.getTransactionCost)
  server.decorate('handleInteraction', handlers.handleInteraction)
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
      interaction: InteractionEvent,
    ) => Promise<LogosResponse>
  }
}
