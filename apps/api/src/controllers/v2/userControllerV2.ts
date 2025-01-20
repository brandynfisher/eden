import { FastifyReply, FastifyRequest } from 'fastify'

export const getUserIdByClerkUserId = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  return reply.status(200).send({ id: userId.toString() })
}
