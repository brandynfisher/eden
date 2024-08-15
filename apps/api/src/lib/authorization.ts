import userAllowList from '../allowList'
import {
  hasFeatureFlag,
  hasMinimumSubscriptionTier,
} from '../middleware/authMiddleware'
import { Task, TaskStatus } from '../models/Task'
import {
  CharactersUpdateArguments,
  ConceptsUpdateArguments,
  CreationsUpdateArguments,
  FeatureFlag,
  SubscriptionTier,
  TasksCreateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

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

export const characterLimitPermissionCheck = (
  request: FastifyRequest,
  currentCharactersCount: number,
) => {
  const { isAdmin, character } = request.user

  const isUser = !isAdmin && !character

  if (
    isUser &&
    currentCharactersCount >= 5 &&
    !hasMinimumSubscriptionTier(request, SubscriptionTier.Basic)
  ) {
    return false
  }

  return true
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
    return true
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
    ? 10
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

export const isAllowedAccess = (server: FastifyInstance, userId: string) => {
  // Access control is only relevant for staging atm
  if (!server.config.ENV_API || server.config.ENV_API !== 'stg') {
    return true
  }

  // allow all if there's no list for the current ENV
  if (!userAllowList || !userAllowList[server.config.ENV_API]) {
    return true
  }

  if (userAllowList[server.config.ENV_API].includes(userId)) {
    console.log(
      `User ${userId} is whitelisted for ENV ${server.config.ENV_API}`,
    )
    return true
  }

  console.error(
    `User ${userId} is not allowed to access ENV ${server.config.ENV_API}`,
  )
  return false
}

export const eden2EarlyAccessCheck = (request: FastifyRequest) => {
  return hasFeatureFlag(request, FeatureFlag.Eden2EarlyAccess)
}
