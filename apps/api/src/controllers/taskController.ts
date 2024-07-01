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
import { Manna, MannaDocument } from '../models/Manna'
import { Task, TaskDocument, TaskSchema, TaskStatus } from '../models/Task'
import { Transaction, TransactionSchema } from '../models/Transaction'
import { InternalMessagesQueues } from '../plugins/internalMessagesPlugin'
import TaskRepository from '../repositories/TaskRepository'
import { verifyToken } from '@clerk/clerk-sdk-node'
import {
  TaskUpdateEvent,
  TasksCreateArguments,
  TasksGetArguments,
  TasksListArguments,
} from '@edenlabs/eden-sdk'
import { on } from 'events'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import WebSocket from 'ws'

const checkUserBalanceIsSufficient = (manna: MannaDocument, amount: number) => {
  const totalBalance = manna.balance + manna.subscriptionBalance
  if (totalBalance < amount) {
    return false
  }
  return true
}

const spendManna = async (manna: MannaDocument, cost: number) => {
  let remainingCost = cost

  // Spend subscription balance first
  if (manna.subscriptionBalance > 0) {
    if (manna.subscriptionBalance >= remainingCost) {
      // If subscription balance covers the entire cost
      manna.subscriptionBalance -= remainingCost
      remainingCost = 0
    } else {
      // If subscription balance only partially covers the cost
      remainingCost -= manna.subscriptionBalance
      manna.subscriptionBalance = 0
    }
  }

  // If there's still cost remaining, spend the normal balance
  if (remainingCost > 0 && manna.balance >= remainingCost) {
    manna.balance -= remainingCost
    remainingCost = 0
  }

  await manna.save()
}

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
  const { generatorName, versionId, config, attributes } =
    request.body as TasksCreateArguments

  // const submittedMaxTasks = await maximumTasksInProgressPermissionCheck(request)
  // if (submittedMaxTasks) {
  //   return reply.status(401).send({
  //     message: `You have reached the maximum number of tasks in progress. Upgrade your subscription to increase your limit.`,
  //   })
  // }

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
  const hasSufficientBalance = checkUserBalanceIsSufficient(manna, cost)
  if (!hasSufficientBalance) {
    return reply.status(401).send({
      message: 'Not enough manna',
    })
  }

  // spend manna
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

  const taskPendingEventMessage = {
    userId: user._id,
    taskId,
    status: 'pending',
    task: {
      taskId,
      config: preparedConfig,
      status: 'pending',
      generator: { generatorName: generator?.generatorName || 'n/a' },
    },
  }

  server.eventEmitter.emit('task-update', taskPendingEventMessage)
  server.internalMessages.publish(
    InternalMessagesQueues.TaskUpdates,
    taskPendingEventMessage,
  )

  // update db
  const taskData: TaskSchema = {
    taskId,
    status: 'pending' as TaskStatus.Pending,
    user,
    character,
    generator: generator._id,
    versionId: generatorVersion.versionId,
    config: preparedConfig,
    attributes,
    cost,
  }
  const task = new Task(taskData)
  await task.save()

  // charge user manna
  await spendManna(manna, cost)

  const transactionData: TransactionSchema = {
    manna: manna._id,
    task: task._id,
    amount: -cost,
  }
  await Transaction.create(transactionData)

  return reply.status(200).send({ taskId })
}

export const getTask = async (request: FastifyRequest, reply: FastifyReply) => {
  const { taskId } = request.params as TasksGetArguments
  const task = await Task.findOne({ taskId })

  await Task.populate(task, {
    path: 'creation',
  })

  await Task.populate(task, {
    path: 'concept',
    select: '_id name user conceptName creationCount thumbnail',
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
    path: 'concept',
    select: '_id name user conceptName creationCount thumbnail',
  })

  await tasksRepository.model.populate(tasks.docs, {
    path: 'generator',
    select: '_id generatorName',
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

  reply.header('Connection', 'keep-alive')

  // send initial message
  reply.sse({ event: 'init-ping', data: JSON.stringify({ heartbeat: userId }) })

  // keep the connection alive.
  const keepAliveTimer = setInterval(() => {
    // console.log('SSE keep alive', { event: 'keep-alive', data: JSON.stringify({ heartbeat: userId }) })
    reply.sse({
      event: 'keep-alive',
      data: JSON.stringify({ heartbeat: userId }),
    })
  }, 15000) // Send a keep-alive every 15 seconds

  reply.sse(
    // gather all accumulated emit calls for this tick
    (async function* source() {
      server.log.info('REPLY SSE', userId)
      try {
        // handle task update emits
        for await (const [event] of on(server.eventEmitter, 'task-update')) {
          const taskUpdate = event as TaskUpdateEvent
          server.log.info({
            taskUpdate,
            userId: userId.toString(),
            taskId,
            event,
          })
          if (
            taskUpdate.userId.toString() === userId.toString() &&
            (!taskId || taskUpdate.taskId === taskId)
          ) {
            server.log.info('sending SSE task update', {
              event: 'task-update',
              data: JSON.stringify(event),
            })

            // send SSE message
            yield {
              event: 'task-update',
              data: JSON.stringify(event),
            }
          }
        }
      } catch (e) {
        console.error(e)
      }
    })(),
  )

  request.socket.on('close', () => {
    // console.log('request socket close')
    // console.log('CLEARING keepAliveTimer')
    clearInterval(keepAliveTimer)
    reply.raw.end()
  })
}

// export type SocketClientEventName = 'auth'|'task-create'
export enum SocketClientEventName {
  Auth = 'auth',
  TaskCreate = 'task-create',
}

export enum SocketServerEventName {
  TaskUpdate = 'task-update',
}

export type SocketClientEvent = {
  event: SocketClientEventName
  data?: { [key: string]: string }
}

export type SocketMetaData = {
  connectionId: string
  isAuthenticated: boolean
  userId: null | string
}

export const subscribeWebSocketTaskUpdates = function wsHandler(
  this: FastifyInstance,
  socket: WebSocket.WebSocket,
  // request: FastifyRequest,
) {
  // console.log('subscribeWebSocketTaskUpdates')

  const metaData: SocketMetaData = {
    connectionId: uuidv4(),
    isAuthenticated: false,
    userId: null,
  }

  // we assume the connection to be unauthenticated by default
  console.log('WS:', metaData.connectionId, '[ Awaiting auth event ]')
  try {
    // listen to internal message queue and forward task update events to the respective client
    const internalEmitterEventHandler = async (task: TaskDocument) => {
      console.log('internalEmitterEventHandler', metaData, task)

      const userDocument = await User.findOne({ _id: task.user })

      if (!userDocument) {
        this.log.error(`User not found ${task.user}`)
        return
      }
      // console.log(metaData?.userId, userDocument.userId)

      // ensure socket message is only sent to the intended recipient
      if (metaData?.userId === userDocument.userId) {
        socket.send(
          JSON.stringify({
            event: 'task-update',
            data: {
              task,
            },
          }),
        )
      }
    }

    this.internalMessages.connection.on(
      InternalMessagesQueues.TaskUpdates,
      internalEmitterEventHandler,
    )

    socket.on('message', async message => {
      try {
        const msgJson = JSON.parse(message.toString()) as SocketClientEvent

        if (!msgJson) {
          socket.send(
            JSON.stringify({
              event: 'message-info',
              data: {
                message: `onMessage::error - invalid msgJson - received message: ${message.toString()}`,
              },
            }),
          )
          return
        }

        if (!msgJson.event) {
          socket.send(
            JSON.stringify({
              event: 'message-info',
              data: {
                message: `onMessage::error - missing event name - received message: ${message.toString()}`,
              },
            }),
          )
          return
        }

        // handle auth event
        if (
          msgJson.event === SocketClientEventName.Auth &&
          msgJson.data &&
          msgJson.data.userId &&
          msgJson.data.token
        ) {
          console.log(
            'WS:',
            metaData.connectionId,
            '[ Received auth event ]',
            msgJson.data?.userId,
          )
          const tokenClaims = await verifyToken(msgJson.data.token, {
            authorizedParties: [
              this.config.FRONTEND_URL,
              this.config.API_URL,
              this.config.EDEN2_FRONTEND_URL,
            ],
            jwtKey: this.config.CLERK_JWT_KEY,
          })

          // check that claims resolved and that resolved userId (sub) matches what the client passed
          if (!tokenClaims || tokenClaims.sub !== msgJson.data.userId) {
            metaData.isAuthenticated = false
            metaData.userId = null
            socket.send(
              JSON.stringify({
                event: 'auth-info',
                data: {
                  message: `onMessage::error - invalid token - received message: ${message.toString()}`,
                },
              }),
            )
            return
          }

          metaData.isAuthenticated = true
          metaData.userId = msgJson.data.userId
          console.log(
            'WS:',
            metaData.connectionId,
            '[ Authenticated ]',
            metaData.userId,
          )
          socket.send(
            JSON.stringify({
              event: 'auth-info',
              data: {
                message: `onMessage::success - authenticated - ${metaData.userId}, ${metaData.connectionId}`,
              },
            }),
          )
          return
        }

        // authentication guard
        if (!metaData.isAuthenticated) {
          socket.send(
            JSON.stringify({
              event: 'auth-info',
              data: {
                message: `onMessage::error - not authenticated - received message: ${message.toString()}`,
              },
            }),
          )
          return
        }

        // assume authenticated socket from here on
        console.log('onMessage', msgJson)
        // socket.send(
        //   `server echo: ${message.toString()} ${JSON.stringify(metaData)}`,
        // )
      } catch (e) {
        console.error('Caught error in websocket onMessage handler', e)
        socket.send(`onMessage::error - caught ${e}`)
      }
    })

    // clean up on socket close
    socket.on('close', () => {
      this.internalMessages.connection.off(
        InternalMessagesQueues.TaskUpdates,
        internalEmitterEventHandler,
      )
    })
  } catch (e) {
    console.log('Caught error subscribeWebSocketTaskUpdates', e)
  }
}
