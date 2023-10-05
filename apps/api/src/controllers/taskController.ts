import {
  TasksCreateArguments,
  TasksGetArguments,
  TasksListArguments,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ChatCompletionRequestMessage } from 'openai'

import {
  getDefaultGeneratorVersion,
  getLatestGeneratorVersion,
  prepareConfig,
} from '../lib/generator'
import { Completion, CompletionInput } from '../models/Completion'
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
  const preparedConfig = prepareConfig(generatorVersion.parameters, config)

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

  await Task.populate(task, {
    path: 'creation',
  })

  await Task.populate(task, {
    path: 'generator',
    select: 'generatorName',
  })

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

export const createCompletion = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { prompt } = request.body as { prompt: string }
  const completionText = await server.complete(server, prompt)
  const completionInput: CompletionInput = {
    prompt,
    completion: completionText,
  }
  const completion = await Completion.create(completionInput)
  return reply.status(200).send({
    completion: {
      id: completion.id,
      text: completionText,
    },
  })
}

type ChatMessage = {
  sender: string
  message: string
}

export const createChatCompletion = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { chat } = request.body as { chat: ChatMessage[] }

  const chatMessages: ChatCompletionRequestMessage[] = chat.map(m => {
    return {
      role: m.sender == 'bot' ? 'assistant' : m.sender,
      content: m.message,
    } as ChatCompletionRequestMessage
  })

  console.log(chatMessages)

  const response = await server.openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: chatMessages,
    temperature: 1,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  const completionText = response?.data?.choices[0].message?.content || 'error'

  const prompt = chatMessages.map(m => `${m.role}: ${m.content}`).join('\n')

  const completionInput: CompletionInput = {
    prompt: prompt,
    completion: completionText,
  }

  const completion = await Completion.create(completionInput)
  return reply.status(200).send({
    completion: {
      id: completion.id,
      text: completionText,
    },
  })
}
