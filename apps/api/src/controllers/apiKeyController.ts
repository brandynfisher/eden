import {
  ApiKeysCreateArguments,
  ApiKeysDeleteArguments,
  ApiKeysListArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { checkUserFlags } from '../lib/data'
import { randomId } from '../lib/util'
import { ApiKey, ApiKeyInput } from '../models/ApiKey'
import { FeatureFlag, User } from '../models/Creator'
import ApiKeyRepository from '../repositories/ApiKeyRepository'

export const createApiKey = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { note } = request.body as ApiKeysCreateArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const hasApiAccess = await checkUserFlags(user, FeatureFlag.Preview)
  if (!hasApiAccess) {
    return reply.status(403).send({
      message: 'API access not enabled',
    })
  }

  const apiKey = randomId(24)
  const apiSecret = randomId(24)

  const input: ApiKeyInput = {
    user: userId,
    apiKey,
    apiSecret,
    note,
  }

  const apiKeyRepository = new ApiKeyRepository(ApiKey)
  await apiKeyRepository.create(input)

  return reply.status(200).send({
    apiKey: {
      apiKey,
      apiSecret,
    },
  })
}

export const deleteApiKey = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { apiKey } = request.body as ApiKeysDeleteArguments

  if (!apiKey) {
    return reply.status(400).send({
      message: 'Missing API Key',
    })
  }

  const dbApiKey = await ApiKey.findOne({
    apiKey,
    user: userId,
  })

  if (!dbApiKey) {
    return reply.status(401).send({
      message: 'API key not found',
    })
  }

  await dbApiKey.delete()

  return reply.status(200).send({})
}

export const listApiKeys = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { limit, page, sort } = request.query as ApiKeysListArguments

  const apiKeyRepository = new ApiKeyRepository(ApiKey)
  const apiKeys = await apiKeyRepository.query(
    {
      user: userId,
    },
    {
      limit,
      page,
      sort,
    },
  )

  return reply.status(200).send(apiKeys)
}
