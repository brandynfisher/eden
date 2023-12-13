import {
  CharactersUpdateArguments,
  ConceptsUpdateArguments,
  CreationsUpdateArguments,
  SubscriptionTier,
  TasksCreateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { hasMinimumSubscriptionTier } from '../middleware/authMiddleware'

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

export const taskPrivacyPermissionCheck = (
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

export const characterPrivacyPermissionCheck = (
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

export const creationPrivacyPermissionCheck = (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { isPrivate } = request.body as CreationsUpdateArguments

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

export const conceptPrivacyPermissionCheck = (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { isPrivate } = request.body as ConceptsUpdateArguments

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

export const conceptExportPermissionCheck = (
  request: FastifyRequest,
): boolean => {
  if (hasMinimumSubscriptionTier(request, SubscriptionTier.Pro)) {
    return true
  }

  return false
}
