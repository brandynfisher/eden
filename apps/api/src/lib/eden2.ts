import { TaskDocument } from '../models/Task'
import { InternalMessagesQueues } from '../plugins/internalMessagesPlugin'
import { FastifyInstance } from 'fastify'

type GenericUpdate = { [key: string]: string | number | boolean }

// updated fields are a flat structure that uses dot notation for sub documents, e.g. { 'task.output.files.0': 'http://12312312' }
export const handleTaskUpdateStreamEvent = async (
  server: FastifyInstance,
  task: TaskDocument,
  _updatedFields?: GenericUpdate,
) => {
  // console.log('handleTaskUpdateStreamEvent', { updatedFields, task })
  // const isStatusChange = !updatedFields || !!updatedFields.status

  // // @todo: is there any thing specific we need to do based on
  // if (isStatusChange) {
  //   console.log('task status change', task.status)
  //   switch (task.status) {
  //     case 'pending':
  //       break
  //     case 'running':
  //       break
  //     case 'completed':
  //       break
  //     case 'failed':
  //       break
  //     default:
  //       throw new Error(`Unknown status ${task.status}`)
  //   }
  // }

  server.internalMessages.publish(InternalMessagesQueues.TaskUpdates, task)
}
