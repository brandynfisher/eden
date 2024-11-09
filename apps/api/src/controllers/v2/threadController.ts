import { User } from '../../models/Creator'
import { ThreadsCreateArguments } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const createThreadMessage = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { threadId, agentId, content, attachments } =
    request.body as ThreadsCreateArguments

  const userDocument = await User.findById(userId)
  if (!userDocument) {
    return reply.status(404).send({
      message: `User not found`,
    })
  }

  const modalRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/create`,
    data: {
      workflow: 'chat',
      args: {
        thread_id: threadId,
        agent_id: agentId,
        content,
        attachments,
      },
      user: userId,
    },
  }

  server.log.info('> modal::request::chat')
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

    server.log.info('< modal::response::chat')
    server.log.info(modalResponse.data)

    if (!modalResponse || !modalResponse.data) {
      console.log('malformed response', modalResponse)
      return reply.status(500).send({
        message: `Empty / Unexpected response from compute api`,
      })
    }

    console.log('send', { success: true })

    return reply.status(200).send({ success: true })
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage =
      error && error.response && error.response.data
        ? error.response.data
        : 'Unknown Error'

    server.log.error({
      message: 'Failed to create thread/message',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}
