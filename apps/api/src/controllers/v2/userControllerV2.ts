import { FastifyReply, FastifyRequest } from 'fastify'

export const getUserIdByClerkUserId = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user

  if (!userId) {
    return reply.status(404).send({ message: 'User not found' })
  }

  return reply.status(200).send({ id: userId.toString() })
}
