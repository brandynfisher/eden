import { User } from '../../models/Creator'
import { TaskV2Document } from '../../models/v2/TaskV2'
import { InternalMessagesQueues } from '../../plugins/internalMessagesPlugin'
import { verifyToken } from '@clerk/clerk-sdk-node'
import { FastifyInstance } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import WebSocket from 'ws'

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
        socket.send(
          JSON.stringify({
            event: 'message-error',
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
