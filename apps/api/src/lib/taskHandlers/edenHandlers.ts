import axios from 'axios'
import { FastifyInstance } from 'fastify'

import { Concept } from '../../models/Concept'
import { Creation } from '../../models/Creation'
import { User } from '../../models/Creator'
import { Generator } from '../../models/Generator'
import { Manna } from '../../models/Manna'
import { Task } from '../../models/Task'
import { Transaction } from '../../models/Transaction'
import { TaskHandlers } from '../../plugins/tasks'
import * as llm from './llm'
import * as replicate from './replicate'
import * as tts from './tts'

type TaskProvider = 'llm' | 'replicate' | 'tts'

const providers = new Map<TaskProvider, any>([
  ['llm', llm],
  ['tts', tts],
  ['replicate', replicate],
])

type TaskStatus =
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

interface TaskUpdate {
  id: string
  status: TaskStatus
  output: any[]
  error: string
}

interface TaskOutput {
  result: string
  files: string[]
  thumbnails: string[]
  name: string
  attributes: any
  progress: number
  isFinal: boolean
}

const submitTask = async (
  server: FastifyInstance,
  generatorVersion: any,
  config: any,
) => {
  const { provider } = generatorVersion
  const task = await providers
    .get(provider)
    .submitTask(server, generatorVersion, config)
  return task.id
}

const handleUpdate = async (
  server: FastifyInstance,
  taskId: string,
  output: TaskOutput[],
  status?: string,
) => {
  const task = await Task.findOne({
    taskId,
  })
  if (!task) {
    throw new Error(`Could not find task ${taskId}`)
  }

  output = Array.isArray(output) ? output : [output]
  output = output.filter((o: TaskOutput) => o)

  const intermediateOutputs = output.filter((o: TaskOutput) => !o.isFinal)
  const finalOutputs = output.filter((o: TaskOutput) => o.isFinal)

  const isCompleted = finalOutputs.length > 0 && status == 'succeeded'
  const maxProgress = Math.max(
    ...intermediateOutputs.map((o: TaskOutput) => o.progress),
  )

  // only update status if not already completed/failed
  const taskStatusUpdate = {
    status: isCompleted ? 'completed' : 'running',
    progress: isCompleted ? 1.0 : Math.max(maxProgress, task.progress || 0),
  } as {
    output?: TaskOutput[]
    status: string
    progress: number
  }
  await Task.updateOne(
    { taskId, status: { $nin: ['completed', 'failed'] } },
    {
      $set: taskStatusUpdate,
    },
  )

  const taskUpdate = {}

  const filteredIntermediateOutputs = intermediateOutputs.filter(
    o => o.files && Array.isArray(o.files) && o.files.length > 0,
  )

  if (
    !task.intermediateOutputs ||
    filteredIntermediateOutputs.length > task.intermediateOutputs.length
  ) {
    const intermediateResults = filteredIntermediateOutputs.map(
      async (o: TaskOutput) => ({ files: o.files, progress: o.progress }),
    )
    Object.assign(taskUpdate, {
      intermediateOutputs: await Promise.all(intermediateResults),
    })
  }

  if (isCompleted) {
    const finalOutput = finalOutputs.slice(-1)[0]
    Object.assign(taskUpdate, { output: finalOutput })
    const generator = await Generator.findById(task.generator)

    if (generator?.output == 'creation') {
      for (let i = 0; i < finalOutput.files.length; i++) {
        const creationData = {
          user: task.user,
          task: task._id,
          uri: finalOutput.files[i],
          thumbnail: finalOutput.thumbnails[i],
          name: finalOutput.name,
          attributes: finalOutput.attributes,
          mediaAttributes: {},
        }
        if (finalOutput.files[i]) {
          const { uri, mediaAttributes } = await server.uploadUrlAsset(
            server,
            finalOutput.files[i],
          )
          creationData.uri = uri
          creationData.mediaAttributes = mediaAttributes
        }
        if (finalOutput.thumbnails[i]) {
          creationData.thumbnail = await server.uploadThumbnailAsset(
            server,
            finalOutput.thumbnails[i],
          )
        }
        const creation = await Creation.create(creationData)
        Object.assign(taskUpdate, {
          creation: creation._id,
          status: 'completed',
          progress: 1.0,
        })
        // todo: maybe fire one webhook with all creations instead of per file
        if (task.webhooks) {
          task.webhooks.forEach(async (webhook: string) => {
            await axios.post(webhook, {
              taskId,
              creation,
            })
          })
        }
      }
    } else if (generator?.output == 'concept') {
      for (let i = 0; i < finalOutput.files.length; i++) {
        // version the concept's public name (v2, v3, etc)
        let publicName = finalOutput.name
        const concepts = await Concept.find({
          user: task.user,
          name: publicName,
        })
        if (concepts.length > 0) {
          const baseName = publicName
          let version = 2
          let newName = `${baseName}_v${version}`
          while (
            await Concept.findOne({
              user: task.user,
              name: newName,
            })
          ) {
            version++
            newName = `${baseName}_v${version}`
          }
          publicName = newName
        }
        const conceptData = {
          user: task.user,
          task: task._id,
          name: publicName,
          conceptName: finalOutput.name,
          checkpoint: 'sdxl-v1.0', //task.config.checkpoint,
          training_images: task.config.lora_training_urls,
          uri: finalOutput.files[i],
          thumbnail: finalOutput.thumbnails[0],
        }
        if (finalOutput.files[i]) {
          const { uri, mediaAttributes } = await server.uploadUrlAsset(
            server,
            finalOutput.files[i],
          )
          conceptData.uri = uri
        }
        if (finalOutput.thumbnails[i]) {
          conceptData.thumbnail = await server.uploadThumbnailAsset(
            server,
            finalOutput.thumbnails[i],
          )
        }
        const concept = await Concept.create(conceptData)
        Object.assign(taskUpdate, {
          concept: concept._id,
          status: 'completed',
          progress: 1.0,
        })
        if (task.webhooks) {
          task.webhooks.forEach(async (webhook: string) => {
            await axios.post(webhook, {
              taskId,
              concept,
            })
          })
        }
      }
    }
  }

  await Task.updateOne(
    {
      taskId,
    },
    {
      $set: taskUpdate,
    },
  )
}

const handleUpdateUniversal = async (
  server: FastifyInstance,
  taskId: string,
  output: string[] | string,
  status?: string,
) => {
  const task = await Task.findOne({
    taskId,
  })
  if (!task) {
    throw new Error(`Could not find task ${taskId}`)
  }

  output = Array.isArray(output) ? output : [output]
  const isCompleted = output.length > 0 && status == 'succeeded'

  const taskUpdate = {
    status: isCompleted ? 'completed' : 'running',
    progress: isCompleted ? 1.0 : 0,
  } as { output?: TaskOutput[]; status: string; progress: number }

  if (isCompleted) {
    Object.assign(taskUpdate, { output })
    const generator = await Generator.findById(task.generator)

    if (generator?.output == 'creation') {
      for (let i = 0; i < output.length; i++) {
        const creationData = {
          user: task.user,
          task: task._id,
          uri: output[i],
          thumbnail: null,
          name: task.config.prompt,
          attributes: null,
          mediaAttributes: {},
        }
        if (output[i]) {
          const { uri, mediaAttributes } = await server.uploadUrlAsset(
            server,
            output[i],
          )
          creationData.uri = uri
          creationData.mediaAttributes = mediaAttributes
        }
        // todo: make a thumbnail
        const creation = await Creation.create(creationData)
        Object.assign(taskUpdate, { creation: creation._id })
        if (task.webhooks) {
          task.webhooks.forEach(async (webhook: string) => {
            await axios.post(webhook, {
              taskId,
              creation,
            })
          })
        }
      }
    }
  }

  await Task.updateOne(
    {
      taskId,
    },
    {
      $set: taskUpdate,
    },
  )
}

const handleFailure = async (taskId: string, error: string) => {
  const task = await Task.findOne({
    taskId,
  })
  if (!task) {
    throw new Error(`Could not find task ${taskId}`)
  }
  const taskUpdate = {
    status: 'failed',
    error,
  }
  await Task.updateOne(
    {
      taskId,
    },
    {
      $set: taskUpdate,
    },
  )

  // refund the user
  const manna = await Manna.findOne({
    user: task.user,
  })

  if (!manna) {
    throw new Error(`Could not find manna for user ${task.user}`)
  }

  const mannaUpdate = {
    balance: manna.balance + task.cost,
  }

  await Manna.updateOne(
    {
      user: task.user,
    },
    {
      $set: mannaUpdate,
    },
  )

  await Transaction.create({
    manna: manna._id,
    task: task._id,
    amount: task.cost,
  })
}

export const receiveTaskUpdate = async (
  server: FastifyInstance,
  update: any,
) => {
  const { id: taskId, status, output, error } = update as any
  console.log(`Received update for task ${taskId} with status ${status}`)
  console.log(`Output: ${JSON.stringify(output)}`)
  if (error) {
    console.error(`Error for task ${taskId}: ${error}`)
  }

  const task = await Task.findOne({
    taskId,
  })
  if (!task) {
    throw new Error(`Could not find task ${taskId}`)
  }

  const generator = await Generator.findById(task.generator)
  if (!generator) {
    throw new Error(`Could not find generator ${task.generator}`)
  }

  const generatorName = generator.generatorName

  switch (status) {
    case 'starting':
      // await handleStarting(server, taskId);
      break
    case 'processing':
      if (generatorName === 'zeroscope-v2-xl') {
        await handleUpdateUniversal(server, taskId, output, 'processing')
      } else {
        await handleUpdate(server, taskId, output, 'processing')
      }
      break
    case 'succeeded':
      if (generatorName === 'zeroscope-v2-xl') {
        await handleUpdateUniversal(server, taskId, output, 'succeeded')
      } else {
        await handleUpdate(server, taskId, output, 'succeeded')
      }
      break
    case 'failed':
      await handleFailure(taskId, error)
      break
    case 'cancelled':
      await handleFailure(taskId, 'Cancelled')
      break
    default:
      throw new Error(`Unknown status ${status}`)
  }
}

const getTransactionCost = (
  server: FastifyInstance,
  generatorVersion: any,
  config: any,
) => {
  const { provider } = generatorVersion
  const cost = providers
    .get(provider)
    .getTransactionCost(server, generatorVersion, config)
  return cost
}

export const edenHandlers: TaskHandlers = {
  submitTask,
  receiveTaskUpdate,
  getTransactionCost,
}
