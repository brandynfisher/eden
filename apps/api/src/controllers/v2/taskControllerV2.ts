import { calculateMaxDimensions } from '../../lib/eden2'
import { taskRateLimitCheck } from '../../lib/ratelimit'
import { User } from '../../models/Creator'
import { CreationV2 } from '../../models/v2/CreationV2'
import { GeneratorV2 } from '../../models/v2/GeneratorV2'
import { TaskV2Document, TaskV2 as TaskV2Model } from '../../models/v2/TaskV2'
import {
  ImageFormats,
  changeExtension,
  s3ThumbnailUrl,
  s3Url,
} from '../../plugins/s3Plugin'
import { QueryOptions } from '../../repositories/RestfulRepository'
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
import { encode } from 'blurhash'
import { on } from 'events'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import sharp from 'sharp'
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
  const generator = await GeneratorV2.findOne({ key: workflow })

  if (!generator) {
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
    generator.outputType,
  )
  if (!rateLimitCheckResult || rateLimitCheckResult.status !== 'ok') {
    if (server.Sentry) {
      server.Sentry.captureMessage(
        `taskRateLimitCheck failed for user:${userId} | message:${rateLimitCheckResult.message}`,
      )
    }
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
    const error = e as { response?: { data?: string } }
    const errorMessage =
      error && error.response && error.response.data
        ? error.response.data
        : 'Unknown Error'

    server.log.error({ message: 'Failed to create task', error: errorMessage })
    return reply.status(500).send({ error: errorMessage })
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
    minDate,
  } = request.query as TasksV2ListArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const isModelTaskQuery =
    workflow && (workflow === 'lora_trainer' || workflow === 'flux_trainer')
  const typeQuery = !isModelTaskQuery
    ? {
        workflow: { $nin: ['lora_trainer', 'flux_trainer'] },
      }
    : {}

  const tasksRepository = new TaskV2Repository(TaskV2Model)

  const query: {
    user?: string
    status?: string | string[]
    taskId?: string | string[]
    workflow?: string | { $nin: string[] }
    createdAt?: { $gte: Date }
  } = {
    user: user._id.toString(),
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

  if (minDate) {
    query.createdAt = {
      $gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
    }
  }

  const queryOptions: QueryOptions = {
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
  // queryOptions.populate = {
  //   path: 'result.model',
  //   model: 'models',
  //   select: '-args.lora_training_urls',
  // }

  // console.log({ minDate, query, queryOptions })

  const paginatedResponse = await tasksRepository.query(query, queryOptions)

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.creation',
    model: 'creations2',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.creation.user',
    model: 'users',
    select: '_id username userId userImage',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.model',
    model: 'models',
    select: '-args.lora_training_urls',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.model.user',
    model: 'users',
    select: '_id username userId userImage',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'user',
    select: '_id username userId userImage',
  })

  paginatedResponse.docs.forEach(doc => {
    if (doc.result) {
      doc.result = doc.result.map(result =>
        injectResultUrls(server, result, doc.output_type === 'lora'),
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

  const thumbnailName = isModelResult ? result.thumbnail || '' : result.filename
  const thumbnailSize = 1024 // get rid of this special handling once model thumbnails are in line with creations

  return {
    ...result,
    url: s3Url(server, result.filename),
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

  const task = await TaskV2Model.findOne({
    _id: new ObjectId(taskId),
    user: userId,
  })
    .select('-args.lora_training_urls')
    .populate({
      path: 'user',
      select: '_id username userId userImage',
    })

  console.log(task)

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
                injectResultUrls(server, result, task.output_type === 'lora'),
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

      const tasksRepository = new TaskV2Repository(TaskV2Model)
      // socket message is only sent to the intended recipient
      if (metaData?._id?.toString() === task.user.toString()) {
        await tasksRepository.model.populate(task, {
          path: 'result.creation',
          model: 'creations2',
        })

        await tasksRepository.model.populate(task, {
          path: 'result.creation.user',
          model: 'users',
          select: '_id username userId userImage',
        })

        await tasksRepository.model.populate(task, {
          path: 'result.model',
          model: 'models',
          select: '-args.lora_training_urls',
        })

        await tasksRepository.model.populate(task, {
          path: 'result.model.user',
          model: 'users',
          select: '_id username userId userImage',
        })

        await tasksRepository.model.populate(task, {
          path: 'user',
          select: '_id username userId userImage',
        })

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
                          task.output_type === 'lora',
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

  try {
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
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage =
      error && error.response && error.response.data
        ? error.response.data
        : 'Unknown Error'

    server.log.error({ message: 'Failed to cancel task', error: errorMessage })
    return reply.status(500).send({ error: errorMessage })
  }
}

export const publishTaskResult = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    if (!request.user) {
      server.log.warn('Invalid or missing user information in request.')
      return reply.status(400).send({
        message: `Invalid or missing user information`,
      })
    }

    const { userId } = request.user

    if (!request.body || typeof request.body !== 'object') {
      server.log.warn('Invalid or missing request body.')
      return reply.status(400).send({
        message: `Invalid or missing request body`,
      })
    }

    const { taskId, resultFilename } = request.body as TasksV2PublishArguments

    if (!taskId) {
      server.log.warn('taskId is missing or not a string.')
      return reply.status(400).send({
        message: `taskId is missing or invalid`,
      })
    }

    if (!resultFilename) {
      server.log.warn('resultFilename is missing or not a string.')
      return reply.status(400).send({
        message: `resultFilename is missing or invalid`,
      })
    }

    const userDocument = await User.findById(userId)
    if (!userDocument) {
      server.log.warn(`User not found with ID: ${userId}`)
      return reply.status(404).send({
        message: `User not found`,
      })
    }

    const taskDocument = await TaskV2Model.findById(taskId)
    if (!taskDocument) {
      server.log.warn(`Task not found with ID: ${taskId}`)
      return reply.status(404).send({
        message: `Task not found`,
      })
    }

    if (!Array.isArray(taskDocument.result)) {
      server.log.error(
        `Invalid taskDocument.result structure for task ID: ${taskId}`,
      )
      return reply.status(500).send({
        message: `Invalid task result structure`,
      })
    }

    const taskResultIndex = taskDocument.result.findIndex(val => {
      return (
        val.filename === resultFilename ||
        val.filename === s3Url(server, resultFilename) ||
        val.url === resultFilename
      )
    })

    if (taskResultIndex === -1) {
      server.log.warn(
        `Task result not found for filename: ${resultFilename} in task ID: ${taskId}`,
      )
      return reply.status(404).send({
        message: `Task result not found`,
      })
    }

    const taskResult = taskDocument.result[taskResultIndex]

    // Check for Existing Creation**
    const existingCreation = await CreationV2.exists({
      url: resultFilename,
      task: taskId,
    })

    if (existingCreation) {
      server.log.warn(
        `Creation already exists for URL: ${resultFilename} and task ID: ${taskId}`,
      )
      return reply.status(409).send({
        message: `Creation already exists`,
      })
    }

    // server.log.info('Initializing Creation object...')
    // server.log.info({ taskId, resultFilename, taskResult })

    const creation = new CreationV2()

    creation.task = new ObjectId(taskId)
    creation.user = new ObjectId(userId)
    creation.public = false

    creation.args = taskDocument.args
    creation.workflow = taskDocument.workflow
    creation.mediaAttributes = {
      ...taskResult.mediaAttributes,
      type: taskDocument.output_type,
      mimeType: taskResult.mediaAttributes?.mimeType || 'image/jpeg',
    }

    // Generate BlurHash if Applicable
    try {
      const isModelResult = taskDocument.result[0].filename.endsWith('.tar')

      if (!isModelResult) {
        const IMAGE_SIZE = 384
        const thumbnailUrl = s3ThumbnailUrl(
          server,
          taskResult.filename,
          IMAGE_SIZE,
        )
        server.log.info(`Fetching thumbnail from URL: ${thumbnailUrl}`)

        const response = await axios.get(thumbnailUrl, {
          responseType: 'arraybuffer',
          timeout: 5000, // Timeout after 5 seconds
        })
        const buffer = Buffer.from(response.data)

        const aspectRatio =
          (taskResult.mediaAttributes?.width || IMAGE_SIZE) /
          (taskResult.mediaAttributes?.height || IMAGE_SIZE)
        const { width, height } = calculateMaxDimensions(
          aspectRatio,
          IMAGE_SIZE,
        )

        const image = await sharp(buffer)
          .resize(width, height)
          .raw()
          .ensureAlpha()
          .toBuffer()

        const blurhash = encode(
          new Uint8ClampedArray(image.buffer),
          width,
          height,
          4,
          4,
        )

        creation.mediaAttributes.blur = blurhash
        server.log.info(
          `BlurHash generated successfully for result: ${resultFilename}`,
        )
      }
    } catch (e) {
      server.log.error(
        `Error creating blurhash for result: ${resultFilename}`,
        e,
      )
    }

    creation.metadata = taskResult.metadata

    if (!taskResult.filename && !taskResult.url) {
      server.log.error(
        `Missing filename and URL for result: ${resultFilename} in task ID: ${taskId}`,
      )
      return reply.status(500).send({
        message: `Invalid result data`,
      })
    }
    creation.url = taskResult.filename || taskResult.url

    const thumbnailSource = taskResult.filename || taskResult.thumbnail || ''
    creation.thumbnail = changeExtension(thumbnailSource, ImageFormats.WEBP)

    server.log.info('Saving Creation object to the database...')
    const savedCreation = await creation.save()
    server.log.info(`Creation saved with ID: ${savedCreation._id}`)

    server.log.info('Updating task result to mark as published...')
    taskDocument.result[taskResultIndex] = {
      ...taskResult,
      creation: savedCreation._id,
      published: true,
    }

    await taskDocument.save()
    server.log.info(`Task document updated successfully for task ID: ${taskId}`)

    return reply.status(200).send({ creation: savedCreation })
  } catch (error) {
    server.log.error(
      'An unexpected error occurred in publishTaskResult:',
      error,
    )
    return reply.status(500).send({
      message: `An unexpected error occurred.`,
    })
  }
}
