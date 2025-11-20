import { AccountDeletionRequest } from '../../models/AccountDeletionRequest'
import { Manna } from '../../models/Manna'
import { Transaction } from '../../models/Transaction'
import { User } from '../../models/User'
import { UserFeedbackRequest } from '../../models/UserFeedbackRequest'
import { UserPreferences } from '../../models/UserPreferences'
import TransactionRepository from '../../repositories/TransactionRepository'
import {
  sendAccountDeletionRequestEmail,
  sendUserFeedbackEmail,
} from '../../utils/mailchimp'
import { FastifyReply, FastifyRequest } from 'fastify'
import mongoose from 'mongoose'

export type SubmitFeedbackBody = {
  message: string
  subject?: string
  category?: string
}

const MAX_FEEDBACK_SUBMISSIONS_PER_DAY = 5

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

export const pinAgent = async (
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
    const userOid =
      userId instanceof mongoose.Types.ObjectId
        ? userId
        : new mongoose.Types.ObjectId(userId.toString())

    const agentOid = new mongoose.Types.ObjectId(agent_id)

    await UserPreferences.pinAgent(userOid, agentOid)

    return reply.status(200).send({
      message: 'Successfully pinned agent',
    })
  } catch (error) {
    request.server.log.error('Failed to pin agent', error)
    return reply.status(500).send({
      message: 'Failed to pin agent',
    })
  }
}

export const unpinAgent = async (
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
    const userOid =
      userId instanceof mongoose.Types.ObjectId
        ? userId
        : new mongoose.Types.ObjectId(userId.toString())

    const agentOid = new mongoose.Types.ObjectId(agent_id)

    await UserPreferences.unpinAgent(userOid, agentOid)

    return reply.status(200).send({
      message: 'Successfully unpinned agent',
    })
  } catch (error) {
    request.server.log.error('Failed to unpin agent', error)
    return reply.status(500).send({
      message: 'Failed to unpin agent',
    })
  }
}

export const hideAgent = async (
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
    const userOid =
      userId instanceof mongoose.Types.ObjectId
        ? userId
        : new mongoose.Types.ObjectId(userId.toString())

    const agentOid = new mongoose.Types.ObjectId(agent_id)

    await UserPreferences.hideAgent(userOid, agentOid)

    return reply.status(200).send({
      message: 'Successfully hid agent',
    })
  } catch (error) {
    request.server.log.error('Failed to hide agent', error)
    return reply.status(500).send({
      message: 'Failed to hide agent',
    })
  }
}

export const submitUserFeedback = async (
  request: FastifyRequest<{ Body: SubmitFeedbackBody }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { message, subject, category } = request.body || {}

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return reply.status(400).send({
      message: 'Feedback message is required',
    })
  }

  try {
    const user = await User.findById(userId)
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const submissionsToday = await UserFeedbackRequest.countDocuments({
      user: userId,
      createdAt: { $gte: startOfDay },
    })

    if (submissionsToday >= MAX_FEEDBACK_SUBMISSIONS_PER_DAY) {
      return reply.status(429).send({
        message:
          'Feedback limit reached. Please try again tomorrow or email support@eden.art directly.',
      })
    }

    const trimmedSubject =
      subject && subject.trim().length > 0 ? subject.trim() : undefined
    const trimmedCategory =
      category && category.trim().length > 0 ? category.trim() : undefined
    const trimmedMessage = message.trim()

    const feedbackRequest = await UserFeedbackRequest.create({
      user: userId,
      username: user.username,
      email: user.email,
      subject: trimmedSubject,
      category: trimmedCategory,
      message: trimmedMessage,
    })

    await sendUserFeedbackEmail(request.server, {
      requestId: feedbackRequest._id.toString(),
      message: trimmedMessage,
      subject: trimmedSubject,
      category: trimmedCategory,
      username: user.username,
      userEmail: user.email,
      userObjectId: user._id.toString(),
      clerkUserId: user.userId,
    })

    return reply.status(201).send({
      message: 'Feedback submitted successfully',
      feedbackId: feedbackRequest._id.toString(),
      remainingSubmissionsToday:
        MAX_FEEDBACK_SUBMISSIONS_PER_DAY - (submissionsToday + 1),
    })
  } catch (error) {
    request.server.log.error('Failed to submit user feedback', error)
    return reply.status(500).send({
      message: 'Failed to submit feedback',
    })
  }
}
