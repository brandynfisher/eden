import {
  TasksCreateArguments,
  TasksGetArguments,
  TasksListArguments,
} from '@edenlabs/eden-sdk'
import { TaskUpdateEvent } from '@edenlabs/eden-sdk'
import { on } from 'events'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import {
  maximumTasksInProgressPermissionCheck,
  taskPrivacyPermissionCheck,
} from '../lib/authorization'
import {
  getDefaultGeneratorVersion,
  getLatestGeneratorVersion,
  prepareConfig,
} from '../lib/generator'
import { User } from '../models/Creator'
import {
  Generator,
  GeneratorDocument,
  GeneratorVersionSchema,
} from '../models/Generator'
import { Manna } from '../models/Manna'
import { Task, TaskSchema, TaskStatus } from '../models/Task'
import { Transaction, TransactionSchema } from '../models/Transaction'
import TaskRepository from '../repositories/TaskRepository'

const getGeneratorVersion = (
  generator: GeneratorDocument,
  versionId: string | undefined,
) => {
  if (versionId) {
    const version = generator.versions.find(
      (v: GeneratorVersionSchema) => v.versionId === versionId,
    )
    if (!version) {
      return
    }
    return version
  } else {
    const defaultVersion = getDefaultGeneratorVersion(generator)
    if (defaultVersion) {
      return defaultVersion
    } else {
      return getLatestGeneratorVersion(generator)
    }
  }
}

export const getTaskCost = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { generatorName, versionId, config } =
    request.body as TasksCreateArguments

  // get user
  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  // get generator
  const generator = await Generator.findOne({
    generatorName,
  })

  if (!generator) {
    const generatorNames = await Generator.find().distinct('generatorName')
    return reply.status(400).send({
      message: `Generator ${generatorName} not found. Options are (${generatorNames.join(
        ', ',
      )})`,
    })
  }

  // use versionId if provided else latest
  const generatorVersion = getGeneratorVersion(generator, versionId)
  console.log(`generatorVersion: ${generatorVersion?.versionId}`)
  if (!generatorVersion) {
    return reply.status(400).send({
      message: 'Generator version not found',
    })
  }

  // validate config, add defaults
  const preparedConfig = prepareConfig(generatorVersion, config)

  const cost = server.getTransactionCost(
    server,
    generator,
    generatorVersion,
    preparedConfig,
  )

  return reply.status(200).send({ cost })
}

export const createTask = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, character } = request.user
  const { generatorName, versionId, config, webhooks, attributes } =
    request.body as TasksCreateArguments

  if (taskPrivacyPermissionCheck(request)) {
    return reply.status(401).send({
      message:
        'Only subscribers can use privacy features. Please upgrade your subscription.',
    })
  }

  const submittedMaxTasks = await maximumTasksInProgressPermissionCheck(request)
  if (submittedMaxTasks) {
    return reply.status(401).send({
      message: `You have reached the maximum number of tasks in progress. Upgrade your subscription to increase your limit.`,
    })
  }

  // get generator
  const generator = await Generator.findOne({
    generatorName,
  })
  if (!generator) {
    const generatorNames = await Generator.find().distinct('generatorName')
    return reply.status(400).send({
      message: `Generator ${generatorName} not found. Options are (${generatorNames.join(
        ', ',
      )})`,
    })
  }

  // use versionId if provided else latest
  const generatorVersion = getGeneratorVersion(generator, versionId)
  if (!generatorVersion) {
    return reply.status(400).send({
      message: 'Generator version not found',
    })
  }

  // get user
  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  // validate config, add defaults
  let preparedConfig
  try {
    preparedConfig = prepareConfig(generatorVersion, config)
  } catch (err: any) {
    console.log(err)
    return reply.status(400).send({
      message: err.message,
    })
  }

  // check if user has enough manna
  const manna = await Manna.findOne({ user })
  if (!manna) {
    return reply.status(401).send({
      message: 'User has no manna',
    })
  }

  const cost = server.getTransactionCost(
    server,
    generator,
    generatorVersion,
    preparedConfig,
  )
  if (manna.balance < cost) {
    return reply.status(401).send({
      message: 'Not enough manna',
    })
  }

  // submit task
  const taskId = await server.submitTask(
    server,
    generator,
    generatorVersion,
    preparedConfig,
  )
  if (!taskId) {
    return reply.status(500).send({
      message: 'Failed to submit task',
    })
  }

  // update db
  const taskData: TaskSchema = {
    taskId,
    status: TaskStatus.Pending,
    user,
    character,
    generator: generator._id,
    versionId: generatorVersion.versionId,
    config: preparedConfig,
    webhooks,
    attributes,
    cost,
  }
  const task = new Task(taskData)
  await task.save()

  const transactionData: TransactionSchema = {
    manna: manna._id,
    task: task._id,
    amount: -cost,
  }
  await Transaction.create(transactionData)

  // charge user manna
  manna.balance -= cost
  await manna.save()

  return reply.status(200).send({ taskId })
}

export const getTask = async (request: FastifyRequest, reply: FastifyReply) => {
  const { taskId } = request.params as TasksGetArguments
  const task = await Task.findOne({ taskId })

  await Task.populate(task, {
    path: 'creation',
  })

  await Task.populate(task, {
    path: 'generator',
    select: 'generatorName',
  })

  if (!task) {
    return reply.status(404).send({
      message: 'Task not found',
    })
  }

  const taskObject = task.toObject()
  delete taskObject.config.lora_training_urls

  return reply.status(200).send({ task: taskObject })
}

export const listTasks = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { type, status, taskId, limit, page, sort } =
    request.query as TasksListArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const typeQuery = type
    ? type === 'creations'
      ? {
          $or: [
            { creation: { $ne: null } },
            { 'config.concept_mode': { $exists: false } },
          ],
        }
      : {
          $or: [
            { concept: { $ne: null } },
            { 'config.concept_mode': { $exists: true } },
          ],
        }
    : {}

  const tasksRepository = new TaskRepository(Task)
  const tasks = await tasksRepository.query(
    {
      user: user._id,
      status,
      taskId,
      createdAt: {
        $gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      },
      ...typeQuery,
    },
    {
      limit,
      page,
      sort: {
        ...sort,
        createdAt: -1,
      },
    },
  )

  await tasksRepository.model.populate(tasks.docs, {
    path: 'creation',
  })

  await tasksRepository.model.populate(tasks.docs, {
    path: 'generator',
    select: 'generatorName',
  })

  return reply.status(200).send(tasks)
}

interface TaskUpdateQuery {
  secret: string
}

export const receiveTaskUpdate = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { secret } = request.query as TaskUpdateQuery

  if (secret !== server.config.WEBHOOK_SECRET) {
    return reply.status(401).send({
      message: 'Invalid webhook secret',
    })
  }

  await server.receiveTaskUpdate(server, request.body)
}

export const subscribeTaskUpdates = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { taskId } = request.query as {
    taskId?: string
  }
  console.log(`Subscribing to task updates for user ${userId}`)

  reply.sse(
    (async function* () {
      for await (const [event] of on(server.eventEmitter, 'taskUpdate')) {
        const taskUpdate = event as TaskUpdateEvent
        console.log(`Received task update for task ${taskUpdate.taskId}`)
        console.log(`Task update: ${event}`)
        if (
          taskUpdate.userId.toString() === userId.toString() &&
          (!taskId || taskUpdate.taskId === taskId)
        ) {
          yield {
            event: event.name,
            data: JSON.stringify(event),
          }
        }
      }
    })(),
  )
}
