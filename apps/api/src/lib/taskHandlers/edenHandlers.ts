import { FastifyInstance } from 'fastify'

import { Creation, CreationSchema } from '../../models/Creation'
import { Generator } from '../../models/Generator'
import { LlmCompletion, LlmCompletionSchema } from '../../models/LlmCompletion'
import { Lora, LoraSchema } from '../../models/Lora'
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
  file: string
  thumbnail: string
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
) => {
  const task = await Task.findOne({
    taskId,
  })
  if (!task) {
    throw new Error(`Could not find task ${taskId}`)
  }
  if (task.status === 'completed') {
    return
  }

  output = Array.isArray(output) ? output : [output]
  output = output.filter((o: TaskOutput) => o)

  const intermediateOutputs = output.filter((o: TaskOutput) => !o.isFinal)
  const finalOutputs = output.filter((o: TaskOutput) => o.isFinal)

  const isCompleted = finalOutputs.length > 0
  const maxProgress = Math.max(
    ...intermediateOutputs.map((o: TaskOutput) => o.progress),
  )

  const taskUpdate = {
    status: isCompleted ? 'completed' : 'running',
    progress: isCompleted ? 1.0 : Math.max(maxProgress, task.progress || 0),
  }

  if (
    !task.intermediate_outputs ||
    intermediateOutputs.length > task.intermediate_outputs.length
  ) {
    const intermediateResults = intermediateOutputs.map(
      async (o: TaskOutput) => ({ file: o.file, progress: o.progress }),
    )
    Object.assign(taskUpdate, {
      intermediate_outputs: await Promise.all(intermediateResults),
    })
  }

  if (isCompleted) {
    const finalOutput = finalOutputs.slice(-1)[0]
    Object.assign(taskUpdate, { output: finalOutput })
    const generator = await Generator.findById(task.generator)
    if (generator?.output == 'creation') {
      console.log(finalOutput)
      const creationData: CreationSchema = {
        user: task.user,
        task: task._id,
        uri: finalOutput.file,
        thumbnail: finalOutput.thumbnail,
        name: finalOutput.name,
        attributes: finalOutput.attributes,
      }
      if (finalOutput.file) {
        const asset = await server.uploadUrlAsset(server, finalOutput.file)
        creationData.uri = asset.uri
        creationData.thumbnail = asset.thumbnail
      }
      const creation = await Creation.create(creationData)
      Object.assign(taskUpdate, { creation: creation._id })
    } else if (generator?.output == 'lora') {
      const loraData: LoraSchema = {
        user: task.user,
        task: task._id,
        checkpoint: task.config.checkpoint,
        training_images: task.config.lora_training_urls,
        uri: finalOutput.file,
        name: finalOutput.name,
      }
      if (finalOutput.file) {
        const asset = await server.uploadUrlAsset(
          server,
          finalOutput.file,
          'safetensors',
        )
        loraData.uri = asset.uri
      }
      const lora = await Lora.create(loraData)
      Object.assign(taskUpdate, { lora: lora._id })
    } else if (generator?.output == 'llm') {
      const llmxData: LlmCompletionSchema = {
        user: task.user,
        task: task._id,
        completion: finalOutput.result,
      }
      const llmCompletion = await LlmCompletion.create(llmxData)
      Object.assign(taskUpdate, { llmCompletion: llmCompletion._id })
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
  const { id: taskId, status, output, error } = update as TaskUpdate
  console.log(`Received update for task ${taskId} with status ${status}`)
  if (error) {
    console.error(`Error for task ${taskId}: ${error}`)
  }

  switch (status) {
    case 'starting':
      // await handleStarting(server, taskId);
      break
    case 'processing':
      await handleUpdate(server, taskId, output)
      break
    case 'succeeded':
      // await handleUpdate(server, taskId, output);
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
