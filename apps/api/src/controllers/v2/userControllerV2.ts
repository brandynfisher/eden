import { AccountDeletionRequest } from '../../models/AccountDeletionRequest'
import { Manna } from '../../models/Manna'
import { Transaction } from '../../models/Transaction'
import { User } from '../../models/User'
import { UserPreferences } from '../../models/UserPreferences'
import TransactionRepository from '../../repositories/TransactionRepository'
import { sendAccountDeletionRequestEmail } from '../../utils/mailchimp'
import { FastifyReply, FastifyRequest } from 'fastify'
import mongoose from 'mongoose'

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

export const listTransactions = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const manna = await Manna.findOne({ user: userId })
  if (!manna) {
    return reply.status(400).send({
      message: 'Manna doc not found',
    })
  }

  const { page, limit } = request.query as {
    page: number
    limit: number
  }

  const transactionRepository = new TransactionRepository(Transaction)
  const paginatedResponse = await transactionRepository.query(
    { manna: manna._id },
    { page, limit, sort: { createdAt: -1 } },
  )

  await transactionRepository.model.populate(paginatedResponse.docs, {
    path: 'task',
    model: 'tasks3',
    select: '_id tool user agent',
  })

  await transactionRepository.model.populate(paginatedResponse.docs, {
    path: 'task.agent',
    model: 'agent',
    select: '_id username',
  })

  return reply.status(200).send(paginatedResponse)
}

export const requestAccountDeletion = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  try {
    // Check if there's already a pending deletion request from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentRequest = await AccountDeletionRequest.findOne({
      user: userId,
      status: 'pending',
      createdAt: { $gte: oneDayAgo },
    })

    if (recentRequest) {
      return reply.status(429).send({
        message:
          'An account deletion request has already been submitted recently. Please wait 24 hours before submitting another request.',
      })
    }

    // Fetch user details
    const user = await User.findById(userId)
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    // Create the deletion request
    const deletionRequest = await AccountDeletionRequest.create({
      user: userId,
      userId: user.userId,
      email: user.email,
      status: 'pending',
    })

    // Send email notification to support
    await sendAccountDeletionRequestEmail(
      request.server,
      user.userId,
      user.email || 'No email provided',
      user.username,
    )

    return reply.status(200).send({
      message:
        'Account deletion request submitted successfully. Our team will process your request shortly.',
      requestId: deletionRequest._id,
    })
  } catch (error) {
    request.server.log.error('Failed to request account deletion', error)
    return reply.status(500).send({
      message: 'Failed to submit account deletion request',
    })
  }
}

export const addLastAgent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { agent_id } = request.body as { agent_id: string }
  if (!agent_id) {
    return reply.status(400).send({
      message: 'agent_id is required',
    })
  }

  try {
    // Convert IDs to mongoose.Types.ObjectId
    const userOid =
      userId instanceof mongoose.Types.ObjectId
        ? userId
        : new mongoose.Types.ObjectId(userId.toString())

    const agentOid = new mongoose.Types.ObjectId(agent_id)

    // Use the static method on the model to update last_agents
    await UserPreferences.updateLastAgent(userOid, agentOid)

    // Fetch and return the updated preferences
    const updatedPreferences = await UserPreferences.findOne({
      user: userId,
    }).populate('last_agents', '_id username')

    return reply.status(200).send({
      message: 'Successfully updated last agents',
      preferences: updatedPreferences,
    })
  } catch (error) {
    request.server.log.error('Failed to update last agent', error)
    return reply.status(500).send({
      message: 'Failed to update last agent',
    })
  }
}
