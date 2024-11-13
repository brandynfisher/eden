import { TaskV2Document } from '../models/v2/TaskV2'
import { MessageSchema, ThreadDocument } from '../models/v2/Thread'
import { FastifyInstance } from 'fastify'

type GenericUpdate = { [key: string]: string | number | boolean }

// updated fields are a flat structure that uses dot notation for sub documents, e.g. { 'task.output.files.0': 'http://12312312' }
export const handleTaskUpdateStreamEvent = async (
  server: FastifyInstance,
  task: TaskV2Document,
  _updatedFields?: GenericUpdate,
) => {
  // server.log.info({ msg: 'handleTaskUpdateStreamEvent', task })
  server.internalMessages.publish('task-updates-v2', task)
}

export const handleThreadUpdateStreamEvent = async (
  server: FastifyInstance,
  thread?: ThreadDocument,
  newMessages?: MessageSchema[],
) => {
  server.internalMessages.publish('thread-updates', { thread, newMessages })
}

export const calculateMaxDimensions = (
  aspectRatio: number,
  maxDimension: number,
): {
  width: number
  height: number
} => {
  let width, height
  if (aspectRatio > 1) {
    width = maxDimension
    height = Math.round(maxDimension / aspectRatio)
  } else {
    width = Math.round(maxDimension * aspectRatio)
    height = maxDimension
  }
  return { width, height }
}
