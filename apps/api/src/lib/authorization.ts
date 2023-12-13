import {
  CharactersUpdateArguments,
  FeatureFlag,
  SubscriptionTier,
  TasksCreateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import {
  hasFeatureFlag,
  hasMinimumSubscriptionTier,
} from '../middleware/authMiddleware'

export const apiKeyCreatePreHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const subscriber = await hasMinimumSubscriptionTier(
    request,
    SubscriptionTier.Pro,
  )
  const previewUser = await hasFeatureFlag(request, FeatureFlag.Preview)
  if (!subscriber && !previewUser) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
    })
  }
}

export const taskPrivacyPermissionCheck = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { isAdmin, character } = request.user
  const { config } = request.body as TasksCreateArguments

  const isUser = !isAdmin && !character

  if (
    isUser &&
    config?.isPrivate &&
    !hasMinimumSubscriptionTier(request, SubscriptionTier.Basic)
  ) {
    return reply.status(401).send({
      message:
        'Only subscribers can use privacy features. Please upgrade your subscription.',
    })
  }
}

export const characterPrivacyPermissionCheck = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { isPrivate } = request.body as CharactersUpdateArguments

  if (
    isPrivate &&
    !hasMinimumSubscriptionTier(request, SubscriptionTier.Basic)
  ) {
    return reply.status(401).send({
      message:
        'Only subscribers can use privacy features. Please upgrade your subscription.',
    })
  }
}
