import { Character } from '../../models/Character'
import { Concept } from '../../models/Concept'
import { Creation, CreationInput } from '../../models/Creation'
import { User } from '../../models/Creator'
import { Generator, GeneratorDocument } from '../../models/Generator'
import { Manna } from '../../models/Manna'
import { Task, TaskStatus } from '../../models/Task'
import { Transaction } from '../../models/Transaction'
import { TaskHandlers } from '../../plugins/tasks'
import * as elevenPlay from './elevenPlay'
import * as logos from './logos'
import * as replicate from './replicate'
import axios from 'axios'
import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

type TaskProvider = 'replicate' | 'elevenPlay' | 'logos'

const providers = new Map<TaskProvider, any>([
  ['elevenPlay', elevenPlay],
  ['replicate', replicate],
  ['logos', logos],
])

const universalGenerators = ['zeroscope-v2-xl', 'upscale']

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
  generator: GeneratorDocument,
  generatorVersion: any,
  config: any,
) => {
  const { provider } = generatorVersion
  const task = await providers
    .get(provider)
    .submitTask(server, generator, generatorVersion, config)
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

  const isCompleted = finalOutputs.some(Boolean) && status == 'succeeded'
  const maxProgress = Math.max(
    ...intermediateOutputs.map((o: TaskOutput) => o.progress),
  )

  const taskUpdate = {
    status: 'running',
    progress: Math.max(maxProgress, task.progress || 0),
  }

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

  server.eventEmitter.emit('task-update', {
    userId: task.user,
    taskId,
    status: 'running',
    progress: Math.max(maxProgress, task.progress || 0),
    task: { ...task.toObject(), ...taskUpdate },
  })

  if (isCompleted) {
    const finalOutput = finalOutputs.slice(-1)[0]
    Object.assign(taskUpdate, { output: finalOutput })

    const generator = await Generator.findById(task.generator)
    if (generator?.output == 'creation') {
      const creationData: CreationInput[] = []

      const { nsfw_scores, ...remainingAttributes } =
      finalOutput.attributes || {}
      const finalOutputAttributes = { ...remainingAttributes }

      await Promise.allSettled(
        finalOutput.files.map(async (files, index) => {
          const creationId = new ObjectId()
          const creationUser = task.attributes?.delegateUserId
            ? new ObjectId(task.attributes.delegateUserId)
            : task.user

          const nsfwScore =
            nsfw_scores && nsfw_scores.length ? nsfw_scores[index] : 0
          const isNsfw = nsfwScore && nsfwScore > 0.5

          const creationDocument: CreationInput = {
            _id: creationId,
            user: creationUser,
            character: task.character,
            task: task._id,
            uri: finalOutput.files[index],
            thumbnail: finalOutput.thumbnails[index],
            name: finalOutput.name,
            attributes: {
              ...task.attributes,
              ...finalOutputAttributes,
              nsfw_score: nsfwScore,
            },
            isPrivate: isNsfw ? true : task.config.isPrivate || false,
          }

          if (task.config.lora) {
            creationDocument.concept = new ObjectId(task.config.lora)
          }

          if (task.generator) {
            creationDocument.generator = task.generator
          }

          if (finalOutput.files[index]) {
            const { uri, mediaAttributes } = await server.uploadUrlAsset(
              server,
              finalOutput.files[index],
            )
            creationDocument.uri = uri
            creationDocument.mediaAttributes = mediaAttributes
          }
          if (finalOutput.thumbnails[index]) {
            creationDocument.thumbnail = await server.uploadThumbnailAsset(
              server,
              finalOutput.thumbnails[index],
            )
          }

          creationData.push(creationDocument)
        }),
      )

      // update concept creation count
      if (task.config.lora) {
        await Concept.findOneAndUpdate(
          {
            _id: task.config.lora,
          },
          {
            $inc: {
              creationCount: task.config.n_samples ? task.config.n_samples : 1,
            },
          },
        )
      }

      // update user creation count
      if (task.user) {
        await User.findOneAndUpdate(
          {
            _id: task.user,
          },
          {
            $inc: {
              creationCount: task.config.n_samples ? task.config.n_samples : 1,
            },
          },
        )
      }

      // update character creation count
      if (task.character) {
        await Character.findOneAndUpdate(
          {
            _id: task.character,
          },
          {
            $inc: {
              creationCount: task.config.n_samples ? task.config.n_samples : 1,
            },
          },
        )
      }

      await Promise.allSettled(
        creationData.map(async creationInput => {
          const otherCreationIds = creationData
            .filter(dataItem => dataItem._id !== creationInput._id)
            .map(item => item._id)

          await Creation.create({
            ...creationInput,
            samples: otherCreationIds,
          })
        }),
      )

      if (task.webhooks) {
        for (const webhook of task.webhooks) {
          await axios.post(webhook, {
            taskId,
            creationData,
          })
        }
      }

      // n_samples: add samples field with other creationIds
      if (
        creationData.length > 1 &&
        task.config.n_samples &&
        task.config.n_samples > 1
      ) {
        Object.assign(taskUpdate, {
          samples: creationData.map(item => item._id),
        })
      }

      // update task -
      Object.assign(taskUpdate, {
        creation: creationData[0]._id, // keep using only first creationId here to not break existing logic
        status: 'completed',
        progress: 1.0,
      })

      server.eventEmitter.emit('task-update', {
        userId: task.user._id,
        taskId,
        status: 'completed',
        progress: 1.0,
        result: creationData.map(item => item.uri),
        task: {
          ...task.toObject(),
          ...taskUpdate,
        },
      })

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
          checkpoint: task.config.checkpoint || 'JuggernautXL_v6', //task.config.checkpoint,
          grid_prompts: task.config.grid_prompts || [], //task.config.checkpoint,
          training_images: task.config.lora_training_urls,
          num_training_images:
            finalOutput.attributes && finalOutput.attributes.num_training_images
              ? finalOutput.attributes.num_training_images
              : 0,
          uri: finalOutput.files[i],
          thumbnail: finalOutput.thumbnails[0],
          isPrivate: task.config.isPrivate || false,
        }
        if (finalOutput.files[i]) {
          const { uri } = await server.uploadUrlAsset(
            server,
            finalOutput.files[i],
          )
          conceptData.uri = uri
        }
        if (finalOutput.thumbnails[i]) {
          const { uri } = await server.uploadUrlAsset(
            server,
            finalOutput.thumbnails[i],
          )
          conceptData.thumbnail = uri
        }

        const concept = await Concept.create(conceptData)
        Object.assign(taskUpdate, {
          concept: concept._id,
          status: 'completed',
          progress: 1.0,
        })

        server.eventEmitter.emit('task-update', {
          userId: task.user._id,
          taskId,
          status: 'completed',
          progress: 1.0,
          result: [conceptData.uri],
          task: {
            ...task.toObject(),
            ...taskUpdate
          },
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
      status: { $nin: ['completed', 'failed'] },
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
  const isCompleted = output.some(Boolean) && status == 'succeeded'

  const taskUpdate = {
    status: 'running',
    progress: 0,
  }

  server.eventEmitter.emit('task-update', {
    userId: task.user,
    taskId,
    status: 'running',
    progress: 0,
    task: { ...task.toObject(), ...taskUpdate },
  })

  if (isCompleted) {
    Object.assign(taskUpdate, {
      status: 'completed',
      progress: 1.0,
      output: output,
    })
    const generator = await Generator.findById(task.generator)
    if (generator?.output == 'creation') {
      for (let i = 0; i < output.length; i++) {
        const creationUser = task.attributes?.delegateUserId
          ? new ObjectId(task.attributes.delegateUserId)
          : task.user
        const creationData = {
          user: creationUser,
          character: task.character,
          task: task._id,
          uri: output[i],
          thumbnail: null,
          name: task.config.prompt,
          attributes: task.attributes,
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

        server.eventEmitter.emit('task-update', {
          userId: task.user._id,
          taskId,
          status: 'completed',
          progress: 1.0,
          result: creationData.uri,
          task: {
            ...task.toObject(),
            ...taskUpdate,
          },
        })

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
      status: { $nin: ['completed', 'failed'] },
    },
    {
      $set: taskUpdate,
    },
  )
}

const handleFailure = async (
  server: FastifyInstance,
  taskId: string,
  error: string,
) => {
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

  server.eventEmitter.emit('task-update', {
    userId: task.user._id,
    taskId,
    status: 'failed',
    progress: 1.0,
    result: null,
    task: {
      ...task.toObject(),
      ...taskUpdate
    },
  })
}

export const receiveTaskUpdate = async (
  server: FastifyInstance,
  update: any,
) => {
  const { id: taskId, status, output, error } = update as any
  console.log(`Received update for task ${taskId} with status ${status}`)
  if (output) {
    console.log(`Output: ${JSON.stringify(output)}`)
  }
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
      // await handleStarting(server, taskId)
      break
    case 'processing':
      if (universalGenerators.includes(generatorName)) {
        await handleUpdateUniversal(server, taskId, output, 'processing')
      } else {
        await handleUpdate(server, taskId, output, 'processing')
      }
      break
    case 'succeeded':
      if (universalGenerators.includes(generatorName)) {
        await handleUpdateUniversal(server, taskId, output, 'succeeded')
      } else {
        await handleUpdate(server, taskId, output, 'succeeded')
      }
      break
    case 'failed':
      await handleFailure(server, taskId, error)
      break
    case 'cancelled':
      await handleFailure(server, taskId, 'Cancelled')
      break
    default:
      throw new Error(`Unknown status ${status}`)
  }
}

const getTransactionCost = (
  server: FastifyInstance,
  generator: GeneratorDocument,
  generatorVersion: any,
  config: any,
) => {
  const { provider } = generatorVersion
  const cost = providers
    .get(provider)
    .getTransactionCost(server, generator, generatorVersion, config)
  return cost
}

export const edenHandlers: TaskHandlers = {
  submitTask,
  receiveTaskUpdate,
  getTransactionCost,
}
