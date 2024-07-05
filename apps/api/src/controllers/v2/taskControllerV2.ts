import { User } from '../../models/Creator'
import { TaskV2, TaskV2Document } from '../../models/v2/TaskV2'
import { InternalMessagesQueues } from '../../plugins/internalMessagesPlugin'
import TaskV2Repository from '../../repositories/TaskV2Repository'
import { verifyToken } from '@clerk/clerk-sdk-node'
import {
  TasksV2CreateArguments,
  TasksV2ListArguments,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { on } from 'events'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
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
}

export const createTask = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { workflow, args } = request.body as TasksV2CreateArguments

  if (!server.generatorConfigs) {
    return reply.status(500).send({
      message: `No generators configured`,
    })
  }

  const generatorConfig = server.generatorConfigs.find(
    config => config.name === workflow,
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

  const modalRequest = {
    endpoint: server.config.EDEN_COMPUTE_API_URL,
    data: {
      workflow,
      args,
      user: userId,
    },
  }

  server.log.info('> modal::request')
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

  server.log.info('< modal::response')
  server.log.info(modalResponse.data)

  if (!modalResponse || !modalResponse.data) {
    console.log('malformed response', modalResponse)
    return reply.status(500).send({
      message: `Empty / Unexpected response from compute api`,
    })
  }

  const task = modalResponse.data as TaskV2

  server.internalMessages.publish(InternalMessagesQueues.TaskUpdates, task)

  return reply.status(200).send({ task })
}

export const listTasks = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const {
    // type,
    status,
    taskId,
    limit,
    page,
    sort,
  } = request.query as TasksV2ListArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  //@todo: Revisit to take care of concept task outputs
  // const typeQuery = type
  //   ? type === 'creations'
  //     ? {
  //       $or: [
  //         { creation: { $ne: null } },
  //         { 'config.concept_mode': { $exists: false } },
  //       ],
  //     }
  //     : {
  //       $or: [
  //         { concept: { $ne: null } },
  //         { 'config.concept_mode': { $exists: true } },
  //       ],
  //     }
  //   : {}

  const tasksRepository = new TaskV2Repository(TaskV2)
  const query: TasksV2ListArguments = {
    // _id: taskId,
    user: user._id.toString(),
    // status,
    // createdAt: {
    //   $gte: new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000)),
    // },
    // ...typeQuery,
  }

  if (status) {
    query.status = status
  }

  if (status) {
    query.taskId = taskId
  }

  const tasks = await tasksRepository.query(query, {
    limit,
    page,
    sort: {
      ...sort,
      createdAt: -1,
    },
  })

  console.log({ tasks })

  // @todo: Once data model is decided on and implemented, add populations back in as needed
  // await tasksRepository.model.populate(tasks.docs, {
  //   path: 'creation',
  // })
  // await tasksRepository.model.populate(tasks.docs, {
  //   path: 'concept',
  //   select: '_id name user conceptName creationCount thumbnail',
  // })
  // await tasksRepository.model.populate(tasks.docs, {
  //   path: 'generator',
  //   select: '_id generatorName',
  // })

  return reply.status(200).send(tasks)
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
    (async function* source() {
      server.log.info(`REPLY SSE V2 to user ${userId}`)
      try {
        // handle task update emits
        for await (const [event] of on(server.eventEmitter, 'task-update')) {
          console.log('v2 !!!!!!!!!!!!!!!!!!!!!!!!!!!!', event)
          const taskUpdate = event as TaskV2
          server.log.info({
            taskUpdate,
            userId: userId.toString(),
            taskId,
          })

          if (taskId === 'all') {
            yield {
              event: 'task-update',
              data: JSON.stringify(taskUpdate),
            }
          } else {
            console.log(
              'VERIFY',
              taskId,
              taskUpdate.user.toString(),
              userId.toString(),
              'isRecipient?',
              taskUpdate.user.toString() === userId.toString(),
              'isTask?',
              !taskId || taskUpdate._id.toString() === taskId.toString(),
              'shouldPushUpdate?',
              taskUpdate.user.toString() === userId.toString() &&
                (!taskId || taskUpdate._id.toString() === taskId.toString()),
            )

            if (
              taskUpdate.user.toString() === userId.toString() &&
              (!taskId || taskUpdate._id.toString() === taskId.toString())
            ) {
              server.log.info('sending SSE V2 task update to', {
                event: 'task-update',
                data: JSON.stringify(taskUpdate),
              })

              // send SSE message
              yield {
                event: 'task-update',
                data: JSON.stringify(taskUpdate),
              }
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
    const internalEmitterEventHandler = async (task: TaskV2Document) => {
      console.log('internalEmitterEventHandler', metaData, task)

      const userDocument = await User.findOne({ _id: task.user })

      if (!userDocument) {
        this.log.error(`User not found ${task.user}`)
        return
      }
      // console.log(metaData?.userId, userDocument.userId)

      // ensure socket message is only sent to the intended recipient
      if (metaData?.userId === userDocument.userId) {
        // emit SSE Event
        this.eventEmitter.emit(ServerEventName.TaskUpdate, task)

        // emit WS Event
        socket.send(
          JSON.stringify({
            event: ServerEventName.TaskUpdate,
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
                event: ServerEventName.AuthInfo,
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
        console.log('onMessage', msgJson)
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
        InternalMessagesQueues.TaskUpdates,
        internalEmitterEventHandler,
      )
    })
  } catch (e) {
    console.log('Caught error subscribeWebSocketTaskUpdates', e)
  }
}
