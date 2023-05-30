import 'dotenv/config'
import { FastifyInstance } from 'fastify'

import {
  dummyGetTransactionCost,
  dummyReceiveTaskUpdate,
  dummySubmitAndWaitForTask,
  dummySubmitTask,
} from '../lib/taskHandlers/dummy'
import { GeneratorVersionSchema } from '../models/Generator'

export interface TaskHandlers {
  submitAndWaitForTask: (
    server: FastifyInstance,
    generatorVersion: GeneratorVersionSchema,
    config: any,
  ) => Promise<string>
  submitTask: (
    server: FastifyInstance,
    generatorVersion: GeneratorVersionSchema,
    config: any,
  ) => Promise<string>
  receiveTaskUpdate: (server: FastifyInstance, update: any) => void
  getTransactionCost: (
    server: FastifyInstance,
    generatorVersion: GeneratorVersionSchema,
    config: any,
  ) => number
}

const dummyHandlers: TaskHandlers = {
  submitAndWaitForTask: dummySubmitAndWaitForTask,
  submitTask: dummySubmitTask,
  receiveTaskUpdate: dummyReceiveTaskUpdate,
  getTransactionCost: dummyGetTransactionCost,
}

export const registerTaskHandlers = (
  server: FastifyInstance,
  taskHandlers: TaskHandlers | undefined,
) => {
  const handlers = taskHandlers || dummyHandlers
  server.decorate('submitAndWaitForTask', handlers.submitAndWaitForTask)
  server.decorate('submitTask', handlers.submitTask)
  server.decorate('receiveTaskUpdate', handlers.receiveTaskUpdate)
  server.decorate('getTransactionCost', handlers.getTransactionCost)
}

declare module 'fastify' {
  interface FastifyInstance {
    submitAndWaitForTask: (
      server: FastifyInstance,
      generatorVersion: GeneratorVersionSchema,
      config: any,
    ) => Promise<string>
    submitTask: (
      server: FastifyInstance,
      generatorVersion: GeneratorVersionSchema,
      config: any,
    ) => Promise<string>
    receiveTaskUpdate: (server: FastifyInstance, update: any) => void
    getTransactionCost: (
      server: FastifyInstance,
      generatorVersion: GeneratorVersionSchema,
      config: any,
    ) => number
  }
}
