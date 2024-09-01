import { getFileTypeByMimeType } from '../../lib/eden2'
import { taskRateLimitCheck } from '../../lib/ratelimit'
import { User } from '../../models/Creator'
import { CreationV2 } from '../../models/v2/CreationV2'
import { TaskV2Document, TaskV2 as TaskV2Model } from '../../models/v2/TaskV2'
import {
  ImageFormats,
  changeExtension,
  rawS3BaseUrl,
  s3ThumbnailUrl,
  s3Url,
} from '../../plugins/s3Plugin'
import TaskV2Repository from '../../repositories/TaskV2Repository'
import { verifyToken } from '@clerk/clerk-sdk-node'
import {
  TaskV2,
  TaskV2Result,
  TaskV2Status,
  TasksV2CancelArguments,
  TasksV2CreateArguments,
  TasksV2GetArguments,
  TasksV2ListArguments,
  TasksV2PublishArguments,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { on } from 'events'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import WebSocket from 'ws'

export enum SocketClientEventName {
  Auth = 'auth',
}

export enum ServerEventName {
  TaskUpdate = 'task-update',
  AuthInfo = 'auth-info',
  MessageError = 'message-error',
}

export type SocketClientEvent = {
  event: SocketClientEventName
  data?: { [key: string]: string }
}

export type SocketMetaData = {
  connectionId: string
  isAuthenticated: boolean
  userId: null | string
  _id: null | string
}

export const createTask = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { workflow, args } = request.body as TasksV2CreateArguments

  if (!server.generatorConfigs || !server.generatorConfigs.configs) {
    return reply.status(500).send({
      message: `No generators configured`,
    })
  }

  const generatorConfig = server.generatorConfigs.configs.find(
    generator => generator.key === workflow,
  )

  if (!generatorConfig) {
    return reply.status(404).send({
      message: `Generator ${workflow} not available`,
    })
  }

  const userDocument = await User.findById(userId)
  if (!userDocument) {
    return reply.status(404).send({
      message: `User not found`,
    })
  }

  const rateLimitCheckResult = await taskRateLimitCheck(
    request,
    generatorConfig.outputType,
  )
  if (!rateLimitCheckResult || rateLimitCheckResult.status !== 'ok') {
    return reply.status(429).send({
      message: rateLimitCheckResult.message,
    })
  }

  const modalRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/create`,
    data: {
      workflow,
      args,
      user: userId,
    },
  }

  server.log.info('> modal::request::create')
  server.log.info(modalRequest)

  try {
    const modalResponse = await axios.post(
      modalRequest.endpoint,
      modalRequest.data,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    server.log.info('< modal::response::create')
    server.log.info(modalResponse.data)

    if (!modalResponse || !modalResponse.data) {
      console.log('malformed response', modalResponse)
      return reply.status(500).send({
        message: `Empty / Unexpected response from compute api`,
      })
    }

    const task = modalResponse.data as TaskV2

    return reply.status(200).send({ task })
  } catch (e) {
    server.log.error({ message: 'Failed to create task', error: e })
  }
}

export const listTasks = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const {
    // type,
    workflow,
    status,
    taskId,
    limit = 25,
    page,
    sort,
  } = request.query as TasksV2ListArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const typeQuery =
    !workflow || workflow !== 'lora_trainer'
      ? {
          workflow: { $ne: 'lora_trainer' },
        }
      : {}

  const tasksRepository = new TaskV2Repository(TaskV2Model)

  const query: {
    user?: string
    status?: string | string[]
    taskId?: string | string[]
    workflow?: string | { $ne: string }
  } = {
    user: user._id.toString(),
    // createdAt: {
    //   $gte: new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000)),
    // },
    ...typeQuery,
  }

  if (status) {
    query.status = status
  }

  if (taskId) {
    query.taskId = taskId
  }

  if (workflow) {
    query.workflow = workflow
  }

  const queryOptions = {
    select: '',
    limit,
    page,
    sort: {
      ...sort,
      createdAt: -1,
    },
  }

  // remove training image urls from task args
  queryOptions.select = '-args.lora_training_urls'

  const paginatedResponse = await tasksRepository.query(query, queryOptions)

  paginatedResponse.docs.forEach(doc => {
    if (doc.result) {
      doc.result = doc.result.map(result =>
        injectResultUrls(
          server,
          result,
          !!workflow && workflow === 'lora_trainer',
        ),
      )
    }
  })

  return reply.status(200).send(paginatedResponse)
}

const injectResultUrls = (
  server: FastifyInstance,
  result: TaskV2Result,
  isModelResult: boolean,
): TaskV2Result => {
  if (!result.filename) {
    return result
  }

  const baseS3Url = rawS3BaseUrl(server)
  const mainUrl = isModelResult
    ? `${baseS3Url}/${result.filename}`
    : s3Url(server, result.filename)
  const thumbnailName = isModelResult ? result.thumbnail || '' : result.filename
  const thumbnailSize = isModelResult ? undefined : 1024 // get rid of this special handling once model thumbnails are in line with creations

  return {
    ...result,
    url: mainUrl,
    thumbnail: s3ThumbnailUrl(server, thumbnailName, thumbnailSize),
  }
}

export const getTask = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user
  const { taskId } = request.params as TasksV2GetArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const task = await TaskV2Model.findOne({ _id: taskId, user: userId }).select(
    '-args.lora_training_urls',
  )

  if (!task) {
    return reply.status(404).send({
      message: 'Task not found',
    })
  }

  return reply.status(200).send({ task })
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

  if (!userId) {
    server.log.error(`User not found ${userId}`)
    return
  }

  const internalEmitterEventHandler = async (task: TaskV2Document) => {
    server.log.info({
      msg: 'subscribeTaskUpdates::internalEmitterEventHandler',
      task,
    })
    // server.log.info({ userId: userId, taskUser: task.user })

    // @todo: Could this be done more efficiently?
    // @todo: atm we'd publish events for all connected users internally to then discard all but one

    // ensure socket message is only sent to the intended recipient
    if (userId.toString() === task.user.toString()) {
      const taskWithUrls =
        task && task.result
          ? {
              ...task,
              result: task.result.map(result =>
                injectResultUrls(
                  server,
                  result,
                  task.workflow === 'lora_trainer',
                ),
              ),
            }
          : task

      // emit SSE Event
      server.eventEmitter.emit('SSE-task-update-v2', taskWithUrls)
    }
  }

  server.internalMessages.connection.on(
    'task-updates-v2',
    internalEmitterEventHandler,
  )

  reply.header('Connection', 'keep-alive')

  // send initial message
  reply.sse({
    event: 'init-ping',
    data: JSON.stringify({
      version: 'v2',
      rand: Math.random(),
      heartbeat: userId,
    }),
  })

  // keep the connection alive.
  const keepAliveTimer = setInterval(() => {
    // console.log('SSE keep alive', { event: 'keep-alive', data: JSON.stringify({ heartbeat: userId }) })
    reply.sse({
      event: 'keep-alive',
      data: JSON.stringify({
        version: 'v2',
        rand: Math.random(),
        heartbeat: userId,
      }),
    })
  }, 15000) // Send a keep-alive every 15 seconds

  reply.sse(
    // gather all accumulated emit calls for this tick
    (async function* () {
      // server.log.info(`SSE V2 to user ${userId}`)
      try {
        // handle task update emits
        for await (const [event] of on(
          server.eventEmitter,
          'SSE-task-update-v2',
        )) {
          const taskUpdate = event as TaskV2
          // server.log.info({
          //   taskUpdate,
          //   userId,
          //   taskId,
          // })

          // if (taskId === 'all') {
          //   console.log(
          //     'YIELDING ALL TASK UPDATES',
          //     taskUpdate.user,
          //     taskUpdate._id,
          //     taskUpdate.status,
          //   )
          //   yield {
          //     event: 'task-update',
          //     data: JSON.stringify(taskUpdate),
          //   }
          // } else {
          if (
            taskUpdate.user.toString() === userId.toString() &&
            (!taskId || taskUpdate._id.toString() === taskId.toString())
          ) {
            // server.log.info('sending SSE V2 task update to', {
            //   event: 'task-update',
            //   data: JSON.stringify(taskUpdate),
            // })

            // send SSE message
            yield {
              event: 'task-update',
              data: JSON.stringify(taskUpdate),
            }
          }
          // }
        }
      } catch (e) {
        console.error(e)
      }
    })(),
  )

  request.socket.on('close', () => {
    // console.log('request socket close')`
    // console.log('CLEARING keepAliveTimer')
    clearInterval(keepAliveTimer)
    reply.raw.end()
    server.internalMessages.connection.off(
      // InternalMessagesQueues.TaskUpdatesV2,
      'task-updates-v2',
      internalEmitterEventHandler,
    )
  })
}

export const subscribeWebSocketTaskUpdates = function wsHandler(
  this: FastifyInstance,
  socket: WebSocket.WebSocket,
) {
  const metaData: SocketMetaData = {
    connectionId: uuidv4(),
    isAuthenticated: false,
    userId: null,
    _id: null,
  }

  // assume the connection to be unauthenticated by default
  try {
    // listen to internal message queue and forward task update events to the respective client
    const internalEmitterEventHandler = async (task: TaskV2Document) => {
      // console.log('internalEmitterEventHandler', metaData, task)

      if (!metaData.userId) {
        this.log.error(`User not authenticated/not found - ${task.user}`)
        return
      }

      // socket message is only sent to the intended recipient
      if (metaData?._id?.toString() === task.user.toString()) {
        // emit WS Event
        socket.send(
          JSON.stringify({
            event: ServerEventName.TaskUpdate,
            data: {
              task:
                task && task.result
                  ? {
                      ...task,
                      result: task.result.map(result =>
                        injectResultUrls(
                          this,
                          result,
                          task.workflow === 'lora_trainer',
                        ),
                      ),
                    }
                  : task,
            },
          }),
        )
      }
    }

    this.internalMessages.connection.on(
      // InternalMessagesQueues.TaskUpdatesV2,
      'task-updates-v2',
      internalEmitterEventHandler,
    )

    socket.on('message', async message => {
      try {
        const msgJson = JSON.parse(message.toString()) as SocketClientEvent

        if (!msgJson) {
          socket.send(
            JSON.stringify({
              event: ServerEventName.MessageError,
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
              event: ServerEventName.MessageError,
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
          // console.log(
          //   'WS:',
          //   metaData.connectionId,
          //   '[ Received auth event ]',
          //   msgJson.data?.userId,
          // )
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
                event: ServerEventName.AuthInfo,
                data: {
                  message: `onMessage::error | invalid token - received message: ${message.toString()}`,
                },
              }),
            )
            return
          }

          const userDocument = await User.findOne({
            userId: msgJson.data.userId,
          })

          if (!userDocument) {
            socket.send(
              JSON.stringify({
                event: ServerEventName.AuthInfo,
                data: {
                  message: `onMessage::error - user ${msgJson.data.userId} not found`,
                },
              }),
            )
            return
          }

          metaData.isAuthenticated = true
          metaData.userId = msgJson.data.userId
          metaData._id = userDocument._id
          // console.log(
          //   'WS:',
          //   metaData.connectionId,
          //   '[ Authenticated ]',
          //   metaData.userId,
          // )
          socket.send(
            JSON.stringify({
              event: ServerEventName.AuthInfo,
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
              event: ServerEventName.AuthInfo,
              data: {
                message: `onMessage::error - not authenticated - received message: ${message.toString()}`,
              },
            }),
          )
          return
        }

        // assume authenticated socket from here on
        // console.log('onMessage', msgJson)
        // socket.send(
        //   `server echo: ${message.toString()} ${JSON.stringify(metaData)}`,
        // )
      } catch (e) {
        console.error('Caught error in websocket onMessage handler', e)
        socket.send(
          JSON.stringify({
            event: ServerEventName.MessageError,
            data: { message: `onMessage::error - caught ${e}` },
          }),
        )
      }
    })

    // clean up on socket close
    socket.on('close', () => {
      this.internalMessages.connection.off(
        // InternalMessagesQueues.TaskUpdatesV2,
        'task-updates-v2',
        internalEmitterEventHandler,
      )
    })
  } catch (e) {
    console.log('Caught error subscribeWebSocketTaskUpdates', e)
  }
}

export const cancelTask = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { taskId } = request.body as TasksV2CancelArguments

  if (!taskId) {
    return reply.status(400).send({
      message: `TaskId missing`,
    })
  }

  const userDocument = await User.findById(userId)
  if (!userDocument) {
    return reply.status(404).send({
      message: `User not found`,
    })
  }

  const modalRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/cancel`,
    data: {
      taskId,
      user: userId,
    },
  }

  server.log.info('> modal::request::cancel')
  server.log.info(modalRequest)

  const modalResponse = await axios.post(
    modalRequest.endpoint,
    modalRequest.data,
    {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    },
  )

  server.log.info('< modal::response::cancel')
  server.log.info(modalResponse.data)

  if (!modalResponse || !modalResponse.data) {
    console.log('malformed response', modalResponse)
    return reply.status(500).send({
      message: `Empty / Unexpected response from compute api`,
    })
  }

  const taskStatus = modalResponse.data.status as TaskV2Status

  return reply.status(200).send({ taskStatus })
}

export const publishTaskResult = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { taskId, resultFilename } = request.body as TasksV2PublishArguments

  if (!taskId) {
    return reply.status(400).send({
      message: `taskId missing`,
    })
  }

  if (!resultFilename) {
    return reply.status(400).send({
      message: `resultFilename missing`,
    })
  }

  const userDocument = await User.findById(userId)
  if (!userDocument) {
    return reply.status(400).send({
      message: `User not found`,
    })
  }

  const taskDocument = await TaskV2Model.findById(taskId)
  if (!taskDocument) {
    return reply.status(404).send({
      message: `Task not found`,
    })
  }

  console.log({ resultFilename, taskDocument })

  const taskResultIndex = taskDocument.result.findIndex(val => {
    return (
      val.filename === resultFilename ||
      val.filename === s3Url(server, resultFilename) ||
      val.url === resultFilename
    )
  })

  if (taskResultIndex === -1) {
    return reply.status(404).send({
      message: `Task result not found`,
    })
  }

  const taskResult = taskDocument.result[taskResultIndex]

  const existingCreation = await CreationV2.exists({
    url: resultFilename,
    task: taskId,
  })

  if (existingCreation) {
    return reply.status(409).send({
      message: `Creation already exists`,
    })
  }

  server.log.info('Saving...')
  server.log.info({ taskId, resultFilename, taskResult })
  const creation = new CreationV2()

  creation.task = new ObjectId(taskId)
  creation.user = new ObjectId(userId)

  creation.args = taskDocument.args
  creation.workflow = taskDocument.workflow
  creation.mediaAttributes = {
    ...taskResult.mediaAttributes,
    type:
      getFileTypeByMimeType(
        taskResult.mediaAttributes?.mimeType || 'image/jpeg',
      ) || 'image',
    mimeType: taskResult.mediaAttributes?.mimeType || 'image/jpeg',
  }
  creation.metadata = taskResult.metadata
  creation.url = taskResult.filename || taskResult.url
  creation.thumbnail = changeExtension(
    taskResult.filename || taskResult.thumbnail || '',
    ImageFormats.WEBP,
  )

  const savedCreation = await creation.save()
  const remainingResults = [...taskDocument.result]
  const publishedResult = remainingResults.splice(taskResultIndex, 1)[0]

  taskDocument.result = [
    ...remainingResults,
    {
      ...publishedResult,
      creation: savedCreation._id,
      published: true,
    },
  ]

  await taskDocument.save()

  return reply.status(200).send({ creation })
}
