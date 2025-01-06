import { taskRateLimitCheck } from '../../lib/ratelimit'
import { User } from '../../models/User'
import { ModelV2 } from '../../models/v2/ModelV2'
import { TaskV2Document, TaskV2 as TaskV2Model } from '../../models/v2/TaskV2'
import { ThreadDocument } from '../../models/v2/Thread'
import { ToolV2 } from '../../models/v2/ToolV2'
import { s3ThumbnailUrl, s3Url } from '../../plugins/s3Plugin'
import { QueryOptions } from '../../repositories/RestfulRepository'
import TaskV2Repository from '../../repositories/TaskV2Repository'
import { verifyToken } from '@clerk/clerk-sdk-node'
import {
  MediaOutput,
  TaskV2,
  TaskV2Result,
  TaskV2Status,
  TasksV2CancelArguments,
  TasksV2CreateArguments,
  TasksV2GetArguments,
  TasksV2ListArguments,
  ThreadMessage,
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
  ThreadUpdate = 'thread-update',
  AuthInfo = 'auth-info',
  MessageError = 'message-error',
}

export type SocketClientEvent = {
  event: SocketClientEventName
  data?: { [key: string]: string }
}

export type SocketMetaData = {
  connectionId: string
  msgId: number
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
  const { tool, args } = request.body as TasksV2CreateArguments
  const toolDocument = await ToolV2.findOne({ key: tool })

  if (!toolDocument) {
    return reply.status(404).send({
      message: `Tool ${tool} not available`,
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
    toolDocument.output_type,
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
      tool,
      args,
      user_id: userId,
    },
  }

  server.log.info('> modal::request::create')
  server.log.info(modalRequest)

  if (args.lora) {
    const lora = await ModelV2.findById(args.lora)
    const isOwner = lora?.user.toString() === userId.toString()
    if (!isOwner && !lora?.public) {
      args.use_lora = false
      delete args.lora
      delete args.lora_strength
    }
  }

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

    const taskWithUrls =
      task && task.result
        ? {
            ...task,
            result: task.result.map(result =>
              injectResultUrls(server, result, task.output_type === 'lora'),
            ),
          }
        : task

    return reply.status(200).send({ task: taskWithUrls })
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
    tool,
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
    tool && (tool === 'lora_trainer' || tool === 'flux_trainer')
  const typeQuery = !isModelTaskQuery
    ? {
        tool: { $nin: ['lora_trainer', 'flux_trainer', 'chat'] },
      }
    : {
        tool: { $nin: ['chat'] },
      }

  const tasksRepository = new TaskV2Repository(TaskV2Model)

  const query: {
    user?: string
    status?: string | string[]
    taskId?: string | string[]
    tool?: string | { $nin: string[] }
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

  if (tool) {
    query.tool = tool
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
    path: 'result.output.creation',
    model: 'creations3',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.output.creation.task',
    model: 'tasks3',
    select: '_id args',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.output.creation.user',
    model: 'users3',
    select: '_id username userId userImage',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.output.model',
    model: 'models3',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.output.model.task',
    model: 'tasks3',
    select: '_id args',
  })

  await tasksRepository.model.populate(paginatedResponse.docs, {
    path: 'result.output.model.user',
    model: 'users3',
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
//
// const injectResultUrls = (
//   server: FastifyInstance,
//   result: TaskV2Result,
//   isModelResult: boolean,
// ): TaskV2Result => {
//   if (!result.filename) {
//     return result
//   }
//
//   const thumbnailName = isModelResult ? result.thumbnail || '' : result.filename
//   const thumbnailSize = 1024 // get rid of this special handling once model thumbnails are in line with creations
//
//   // inject urls for each property of result.intermediateOutput, each property contains an array of partial TaskV2Results
//
//
//
//   return {
//     ...result,
//     url: s3Url(server, result.filename),
//     thumbnail: s3ThumbnailUrl(server, thumbnailName, thumbnailSize),
//   }
// }
//

const injectUrlsToMediaOutput = (
  server: FastifyInstance,
  output: MediaOutput,
  isModelResult: boolean,
): MediaOutput => {
  if (!output.filename) {
    return output
  }

  const thumbnailName = isModelResult ? output.thumbnail || '' : output.filename
  const thumbnailSize = 1024 // get rid of this special handling once model thumbnails are in line with creations

  return {
    ...output,
    url: s3Url(server, output.filename),
    thumbnail: s3ThumbnailUrl(server, thumbnailName, thumbnailSize),
  }
}

const injectResultUrls = (
  server: FastifyInstance,
  result: TaskV2Result,
  isModelResult: boolean,
): TaskV2Result => {
  if (!result.output) {
    return result
  }

  if (result.output) {
    result.output = result.output.map(output => {
      const thumbnailName = isModelResult
        ? output.thumbnail || ''
        : output.filename
      const thumbnailSize = 1024 // get rid of this special handling once model thumbnails are in line with creations

      return {
        ...output,
        url: s3Url(server, output.filename),
        thumbnail: s3ThumbnailUrl(server, thumbnailName, thumbnailSize),
      }
    })
  }

  if (result.intermediate_outputs) {
    result.intermediate_outputs = Object.fromEntries(
      Object.entries(result.intermediate_outputs).map(
        ([key, partialResults]) => {
          // console.log(key, partialResults)
          if (Array.isArray(partialResults)) {
            return [
              key,
              partialResults.map(partialResult =>
                injectUrlsToMediaOutput(server, partialResult, isModelResult),
              ),
            ]
          }
          return [key, partialResults]
        },
      ),
    )
  }

  return result
}

export const getTask = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
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
    .populate({
      path: 'result.output.creation',
      model: 'creations3',
    })
    .populate({
      path: 'result.output.creation.task',
      model: 'tasks3',
      select: '_id args',
    })
    .populate({
      path: 'result.output.creation.user',
      model: 'users3',
      select: '_id username userId userImage',
    })
    .populate({
      path: 'result.output.model',
      model: 'models3',
    })
    .populate({
      path: 'result.output.model.task',
      model: 'tasks3',
      select: '_id args',
    })
    .populate({
      path: 'result.output.model.user',
      model: 'users3',
      select: '_id username userId userImage',
    })
    .populate({
      path: 'result.output.model.user',
      model: 'users3',
      select: '_id username userId userImage',
    })

  console.log(task)

  if (!task) {
    return reply.status(404).send({
      message: 'Task not found',
    })
  }

  if (task.result) {
    task.result = task.result.map(result =>
      injectResultUrls(server, result, task.output_type === 'lora'),
    )
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
    (async function* (): AsyncGenerator<{
      event: string
      data: string
    }> {
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

export const subscribeWebSocketUpdates = function wsHandler(
  this: FastifyInstance,
  socket: WebSocket.WebSocket,
) {
  const metaData: SocketMetaData = {
    connectionId: uuidv4(),
    msgId: 0,
    isAuthenticated: false,
    userId: null,
    _id: null,
  }

  // assume the connection to be unauthenticated by default
  try {
    // listen to internal message queue and forward task update events to the respective client
    const internalEmitterEventHandlerTaskUpdates = async (
      task: TaskV2Document,
    ) => {
      // console.log('internalEmitterEventHandler', metaData, task)

      if (!metaData.userId) {
        this.log.error(`User not authenticated/not found - ${task.user}`)
        return
      }

      if (task.tool === 'chat') {
        return
      }

      const tasksRepository = new TaskV2Repository(TaskV2Model)
      // socket message is only sent to the intended recipient
      if (metaData?._id?.toString() === task.user.toString()) {
        await tasksRepository.model.populate(task, {
          path: 'result.output.creation',
          model: 'creations3',
        })

        await tasksRepository.model.populate(task, {
          path: 'result.output.creation.task',
          model: 'tasks3',
          select: '_id args',
        })

        await tasksRepository.model.populate(task, {
          path: 'result.output.creation.user',
          model: 'users3',
          select: '_id username userId userImage',
        })

        await tasksRepository.model.populate(task, {
          path: 'result.output.model',
          model: 'models3',
        })

        await tasksRepository.model.populate(task, {
          path: 'result.output.model.user',
          model: 'users3',
          select: '_id username userId userImage',
        })

        await tasksRepository.model.populate(task, {
          path: 'result.output.model.task',
          model: 'tasks3',
          select: '_id args',
        })

        await tasksRepository.model.populate(task, {
          path: 'user',
          model: 'users3',
          select: '_id username userId userImage',
        })

        // emit WS Event
        socket.send(
          JSON.stringify({
            event: ServerEventName.TaskUpdate,
            connectionId: metaData.connectionId,
            msgId: metaData.msgId,
            data: {
              task:
                task && task.result && Array.isArray(task.result)
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

        metaData.msgId += 1
      }
    }

    this.internalMessages.connection.on(
      // InternalMessagesQueues.TaskUpdatesV2,
      'task-updates-v2',
      internalEmitterEventHandlerTaskUpdates,
    )

    const internalEmitterEventHandlerThreadUpdates = async ({
      thread,
      newMessages,
    }: {
      thread: ThreadDocument
      newMessages: ThreadMessage[]
    }) => {
      // console.log('internalEmitterEventHandlerThreadUpdates', thread)

      if (!metaData.userId) {
        this.log.error(`User not authenticated/not found - ${thread.user}`)
        return
      }

      // console.log(metaData)
      // const threadsRepository = new ThreadRepository(ThreadModel)

      if (!thread.user) {
        this.log.error(
          `Thread ${thread._id} has no user field, skipping update message`,
        )
        return
      }

      // socket message is only sent to the intended recipient
      if (metaData?._id?.toString() === thread.user.toString()) {
        this.log.info(
          `${ServerEventName.ThreadUpdate}: ${metaData.connectionId} - ${metaData.msgId} ${thread._id}`,
        )

        socket.send(
          JSON.stringify({
            event: ServerEventName.ThreadUpdate,
            msgId: metaData.msgId,
            connectionId: metaData.connectionId,
            data: newMessages
              ? {
                  newMessages: newMessages.map(msg => {
                    const hasPendingToolCalls =
                      msg.tool_calls?.length &&
                      msg.tool_calls?.some(
                        call =>
                          !call.status ||
                          call.status === TaskV2Status.Running ||
                          call.status === TaskV2Status.Pending,
                      )
                    return {
                      ...msg,
                      status:
                        hasPendingToolCalls ||
                        (thread.active &&
                          Array.isArray(thread.active) &&
                          thread.active.some(
                            t =>
                              t.toString() === msg.id.toString() ||
                              t.toString() === msg.reply_to?.toString(),
                          ))
                          ? { type: 'running' }
                          : { type: 'complete', reason: 'stop' },
                    }
                  }),
                  thread_id: thread._id,
                  title: thread.title,
                  active: thread.active,
                }
              : {
                  thread: thread,
                  thread_id: thread._id,
                  active: thread.active,
                },
          }),
        )

        metaData.msgId += 1
      }
    }

    this.internalMessages.connection.on(
      'thread-updates',
      internalEmitterEventHandlerThreadUpdates,
    )

    socket.on('message', async message => {
      try {
        const msgJson = JSON.parse(message.toString()) as SocketClientEvent

        if (!msgJson) {
          socket.send(
            JSON.stringify({
              event: ServerEventName.MessageError,
              data: {
                message: `onMessage::error - invalid msgJson - received message:  ${message.toString()}`,
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
        'task-updates-v2',
        internalEmitterEventHandlerTaskUpdates,
      )

      this.internalMessages.connection.off(
        'thread-updates',
        internalEmitterEventHandlerThreadUpdates,
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

// export const publishTaskResult = async (
//   server: FastifyInstance,
//   request: FastifyRequest,
//   reply: FastifyReply,
// ) => {
//   try {
//     if (!request.user) {
//       server.log.warn('Invalid or missing user information in request.')
//       return reply.status(400).send({
//         message: `Invalid or missing user information`,
//       })
//     }
//
//     const { userId } = request.user
//
//     if (!request.body || typeof request.body !== 'object') {
//       server.log.warn('Invalid or missing request body.')
//       return reply.status(400).send({
//         message: `Invalid or missing request body`,
//       })
//     }
//
//     const { taskId, resultFilename } = request.body as TasksV2PublishArguments
//
//     if (!taskId) {
//       server.log.warn('taskId is missing or not a string.')
//       return reply.status(400).send({
//         message: `taskId is missing or invalid`,
//       })
//     }
//
//     if (!resultFilename) {
//       server.log.warn('resultFilename is missing or not a string.')
//       return reply.status(400).send({
//         message: `resultFilename is missing or invalid`,
//       })
//     }
//
//     const userDocument = await User.findById(userId)
//     if (!userDocument) {
//       server.log.warn(`User not found with ID: ${userId}`)
//       return reply.status(404).send({
//         message: `User not found`,
//       })
//     }
//
//     const taskDocument = await TaskV2Model.findById(taskId)
//     if (!taskDocument) {
//       server.log.warn(`Task not found with ID: ${taskId}`)
//       return reply.status(404).send({
//         message: `Task not found`,
//       })
//     }
//
//     if (!Array.isArray(taskDocument.result)) {
//       server.log.error(
//         `Invalid taskDocument.result structure for task ID: ${taskId}`,
//       )
//       return reply.status(500).send({
//         message: `Invalid task result structure`,
//       })
//     }
//
//     let outputIndex = -1
//
//     const taskResultIndex = taskDocument.result.findIndex(result => {
//       outputIndex = result.output.findIndex(
//         output =>
//           output.filename === resultFilename ||
//           output.filename === s3Url(server, resultFilename) ||
//           output.url === resultFilename,
//       )
//
//       return outputIndex !== -1
//     })
//
//     if (taskResultIndex === -1) {
//       server.log.warn(
//         `Task result not found for filename: ${resultFilename} in task ID: ${taskId}`,
//       )
//       return reply.status(404).send({
//         message: `Task result not found`,
//       })
//     }
//
//     if (outputIndex === -1) {
//       server.log.warn(
//         `Task result output not found for filename: ${resultFilename} in task ID: ${taskId}`,
//       )
//       return reply.status(404).send({
//         message: `Task output not found`,
//       })
//     }
//
//     const taskResult = taskDocument.result[taskResultIndex]
//     const taskResultOutput = taskResult.output[outputIndex]
//
//     // Check for Existing Creation**
//     const existingCreation = await CreationV2.exists({
//       url: resultFilename,
//       task: taskId,
//     })
//
//     if (existingCreation) {
//       server.log.warn(
//         `Creation already exists for URL: ${resultFilename} and task ID: ${taskId}`,
//       )
//       return reply.status(409).send({
//         message: `Creation already exists`,
//       })
//     }
//
//     // server.log.info('Initializing Creation object...')
//     // server.log.info({ taskId, resultFilename, taskResult })
//
//     const creation = new CreationV2()
//
//     creation.task = new ObjectId(taskId)
//     creation.user = new ObjectId(userId)
//     creation.public = false
//
//     creation.tool = taskDocument.tool
//     creation.mediaAttributes = {
//       ...taskResultOutput.mediaAttributes,
//       type: taskDocument.output_type,
//       mimeType: taskResultOutput.mediaAttributes?.mimeType || 'image/jpeg',
//     }
//
//     // Generate BlurHash if Applicable
//     try {
//       const isModelResult = taskResultOutput.filename.endsWith('.tar')
//
//       if (!isModelResult) {
//         const IMAGE_SIZE = 384
//         const thumbnailUrl = s3ThumbnailUrl(
//           server,
//           taskResultOutput.filename,
//           IMAGE_SIZE,
//         )
//         server.log.info(`Fetching thumbnail from URL: ${thumbnailUrl}`)
//
//         const response = await axios.get(thumbnailUrl, {
//           responseType: 'arraybuffer',
//           timeout: 5000, // Timeout after 5 seconds
//         })
//         const buffer = Buffer.from(response.data)
//
//         const aspectRatio =
//           (taskResultOutput.mediaAttributes?.width || IMAGE_SIZE) /
//           (taskResultOutput.mediaAttributes?.height || IMAGE_SIZE)
//         const { width, height } = calculateMaxDimensions(
//           aspectRatio,
//           IMAGE_SIZE,
//         )
//
//         const image = await sharp(buffer)
//           .resize(width, height)
//           .raw()
//           .ensureAlpha()
//           .toBuffer()
//
//         const blurhash = encode(
//           new Uint8ClampedArray(image.buffer),
//           width,
//           height,
//           4,
//           4,
//         )
//
//         creation.mediaAttributes.blur = blurhash
//         server.log.info(
//           `BlurHash generated successfully for result: ${resultFilename}`,
//         )
//       }
//     } catch (e) {
//       server.log.error(
//         `Error creating blurhash for result: ${resultFilename}`,
//         e,
//       )
//     }
//
//     creation.metadata = taskResult.metadata
//
//     if (!taskResultOutput.filename && !taskResultOutput.url) {
//       server.log.error(
//         `Missing filename and URL for result: ${resultFilename} in task ID: ${taskId}`,
//       )
//       return reply.status(500).send({
//         message: `Invalid result data`,
//       })
//     }
//     creation.url = taskResultOutput.filename || taskResultOutput.url
//
//     const thumbnailSource =
//       taskResultOutput.filename || taskResultOutput.thumbnail || ''
//     creation.thumbnail = changeExtension(thumbnailSource, ImageFormats.WEBP)
//
//     server.log.info('Saving Creation object to the database...')
//     const savedCreation = await creation.save()
//     server.log.info(`Creation saved with ID: ${savedCreation._id}`)
//
//     server.log.info('Updating task result to mark as published...')
//     taskDocument.result[taskResultIndex] = {
//       ...taskResult,
//       creation: savedCreation._id,
//     }
//
//     await taskDocument.save()
//     server.log.info(`Task document updated successfully for task ID: ${taskId}`)
//
//     if (savedCreation) {
//       savedCreation.url = s3Url(server, savedCreation.url || '')
//       savedCreation.thumbnail = s3ThumbnailUrl(
//         server,
//         savedCreation.thumbnail || '',
//         1024,
//       )
//     }
//
//     return reply.status(200).send({ creation: savedCreation })
//   } catch (error) {
//     server.log.error(
//       'An unexpected error occurred in publishTaskResult:',
//       error,
//     )
//     return reply.status(500).send({
//       message: `An unexpected error occurred.`,
//     })
//   }
// }
