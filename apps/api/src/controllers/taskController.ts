import {
  TasksCreateArguments,
  TasksGetArguments,
  TasksListArguments,
} from '@eden-labs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { getLatestGeneratorVersion, prepareConfig } from '../lib/generator'
import { User } from '../models/Creator'
import { Generator, GeneratorVersionSchema } from '../models/Generator'
import { Manna } from '../models/Manna'
import { Task, TaskSchema, TaskStatus } from '../models/Task'
import { Transaction, TransactionSchema } from '../models/Transaction'
import TaskRepository from '../repositories/TaskRepository'

export const createTask = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { generatorName, versionId, config, webhooks } =
    request.body as TasksCreateArguments

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
  let generatorVersion
  if (versionId) {
    const version = generator.versions.find(
      (v: GeneratorVersionSchema) => v.versionId === versionId,
    )
    if (!version) {
      return reply.status(400).send({
        message: 'Generator version not found',
      })
    }
    generatorVersion = version
  } else {
    generatorVersion = getLatestGeneratorVersion(generator)
  }

  // get user
  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  // validate config, add defaults
  const preparedConfig = prepareConfig(generatorVersion.parameters, config)

  // check if user has enough manna
  const manna = await Manna.findOne({ user })
  if (!manna) {
    return reply.status(401).send({
      message: 'User has no manna',
    })
  }

  const cost = server.getTransactionCost(
    server,
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
    generator: generator._id,
    versionId: generatorVersion.versionId,
    config: preparedConfig,
    webhooks,
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
  return reply.status(200).send({ task })
}

export const listTasks = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { status, taskId, limit, page, sort } =
    request.query as TasksListArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const tasksRepository = new TaskRepository(Task)
  const tasks = await tasksRepository.query(
    {
      user: user._id,
      status,
      taskId,
    },
    {
      limit,
      page,
      sort,
    },
  )

  await tasksRepository.model.populate(tasks.docs, {
    path: 'creation',
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
