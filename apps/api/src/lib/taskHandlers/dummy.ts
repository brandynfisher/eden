import { FastifyInstance } from 'fastify'
import { v4 as uuidv4 } from 'uuid'

import { Creation, CreationSchema } from '../../models/Creation'
import { GeneratorVersionSchema } from '../../models/Generator'
import { Task } from '../../models/Task'
import { TaskHandlers } from '../../plugins/tasks'

const dummyImages: string[] = [
  'https://media.discordapp.net/attachments/1003581679916548207/1113042054960922717/output.jpg',
  'https://media.discordapp.net/attachments/1003581679916548207/1111725311122481304/output.jpg',
]

interface TaskUpdate {
  id: string
}

export const dummySubmitTask = async (
  _: FastifyInstance,
  generatorVersion: GeneratorVersionSchema,
  config: any,
) => {
  console.log(
    `Submitting task for generator ${
      generatorVersion.versionId
    } with config ${JSON.stringify(config)}`,
  )
  return uuidv4()
}

export const dummyReceiveTaskUpdate = async (
  server: FastifyInstance,
  update: any,
) => {
  const { id: taskId } = update as TaskUpdate
  const task = await Task.findOne({
    taskId,
  })
  if (!task) {
    throw new Error(`Could not find task ${taskId}`)
  }

  const image = dummyImages[Math.floor(Math.random() * dummyImages.length)]
  const asset = await server.uploadUrlAsset(server, image)
  const thumbnail = await server.uploadThumbnailAsset(server, asset.assetBuffer)

  const creationData: CreationSchema = {
    user: task.user,
    task: task._id,
    uri: asset.uri,
    thumbnail,
    name: 'Test Image',
    attributes: {},
  }
  const creation = await Creation.create(creationData)

  const taskUpdate = {
    status: 'completed',
    progress: 1.0,
    creation: creation._id,
  }

  await Task.updateOne(
    {
      taskId,
    },
    {
      $set: taskUpdate,
    },
  )

  return update
}

export const dummyGetTransactionCost = (
  _: FastifyInstance,
  generatorVersion: GeneratorVersionSchema,
  config: any,
) => {
  console.log(
    `Getting transaction cost for generator ${
      generatorVersion.versionId
    } with config ${JSON.stringify(config)}`,
  )
  return 1
}

export const dummyTaskHandlers: TaskHandlers = {
  submitTask: dummySubmitTask,
  receiveTaskUpdate: dummyReceiveTaskUpdate,
  getTransactionCost: dummyGetTransactionCost,
}
