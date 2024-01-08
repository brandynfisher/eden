import {
  CharactersUpdateArguments,
  ConceptsUpdateArguments,
  CreationsUpdateArguments,
  SubscriptionTier,
  TasksCreateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { hasMinimumSubscriptionTier } from '../middleware/authMiddleware'
import { Task, TaskStatus } from '../models/Task'

export const apiKeyCreatePreHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const subscriber = hasMinimumSubscriptionTier(request, SubscriptionTier.Pro)
  if (!subscriber) {
    return reply.status(401).send({
      statusCode: 401,
      message:
        'Only pro+ subscribers can create API keys. Please upgrade your subscription.',
    })
  }
}

export const characterRoutePreHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const subscriber = hasMinimumSubscriptionTier(
    request,
    SubscriptionTier.Believer,
  )
  if (!subscriber) {
    return reply.status(401).send({
      statusCode: 401,
      message:
        'Only believer+ subscribers can use characters. Please upgrade your subscription.',
    })
  }
}

export const taskPrivacyPermissionCheck = (request: FastifyRequest) => {
  const { isAdmin, character } = request.user
  const { config } = request.body as TasksCreateArguments

  const isUser = !isAdmin && !character

  if (
    isUser &&
    config?.isPrivate &&
    !hasMinimumSubscriptionTier(request, SubscriptionTier.Basic)
  ) {
    true
  }

  return false
}

export const characterPrivacyPermissionCheck = (request: FastifyRequest) => {
  const { isPrivate } = request.body as CharactersUpdateArguments

  if (
    isPrivate &&
    !hasMinimumSubscriptionTier(request, SubscriptionTier.Basic)
  ) {
    return true
  }

  return false
}

export const creationPrivacyPermissionCheck = (request: FastifyRequest) => {
  const { isPrivate } = request.body as CreationsUpdateArguments

  if (
    isPrivate &&
    !hasMinimumSubscriptionTier(request, SubscriptionTier.Basic)
  ) {
    return true
  }

  return false
}

export const conceptPrivacyPermissionCheck = (request: FastifyRequest) => {
  const { isPrivate } = request.body as ConceptsUpdateArguments

  if (
    isPrivate &&
    !hasMinimumSubscriptionTier(request, SubscriptionTier.Basic)
  ) {
    return true
  }

  return false
}

export const conceptExportPermissionCheck = (
  request: FastifyRequest,
): boolean => {
  if (hasMinimumSubscriptionTier(request, SubscriptionTier.Pro)) {
    return true
  }

  return false
}

const maximumTasksInProgressMap: Record<SubscriptionTier, number> = {
  [SubscriptionTier.Free]: 1,
  [SubscriptionTier.Basic]: 3,
  [SubscriptionTier.Pro]: 6,
  [SubscriptionTier.Believer]: 10,
}

export const maximumTasksInProgressPermissionCheck = async (
  request: FastifyRequest,
) => {
  const { userId, subscriptionTier, featureFlags } = request.user
  const maximumTasksInProgress = featureFlags?.includes('preview')
    ? 99
    : maximumTasksInProgressMap[
        (subscriptionTier as SubscriptionTier) || SubscriptionTier.Free
      ]

  const inProgressStatus: TaskStatus[] = [
    TaskStatus.Pending,
    TaskStatus.Running,
  ]

  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const tasksInProgress = await Task.find({
    userId,
    status: { $in: inProgressStatus },
    createdAt: { $gte: oneHourAgo },
  })

  if (tasksInProgress.length >= maximumTasksInProgress) {
    return true
  }

  return false
}
