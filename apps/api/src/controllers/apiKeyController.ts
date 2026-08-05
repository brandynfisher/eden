import { randomId } from '../lib/util'
import { ApiKey, ApiKeyInput } from '../models/ApiKey'
import { User } from '../models/User'
import ApiKeyRepository from '../repositories/ApiKeyRepository'
import {
  ApiKeysCreateArguments,
  ApiKeysDeleteArguments,
  ApiKeysListArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

export const generateApiKey = () => {
  const apiKey = randomId(24)
  const apiSecret = randomId(24)
  return {
    apiKey,
    apiSecret,
  }
}

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
  //
  const { apiKey, apiSecret } = generateApiKey()

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
      character: { $eq: null },
    },
    {
      limit,
      page,
      sort,
    },
  )

  // The route description already promised "Only partial key values are
  // returned", but the full secret was being sent — so any XSS, shared screen,
  // or logged response handed over working credentials, and keys are stored in
  // plaintext with no expiry, so one leak is permanent account access. The full
  // value is shown once at creation; afterwards only enough to identify which
  // key a row refers to.
  apiKeys.docs = apiKeys.docs.map((doc: any) => {
    const key = typeof doc?.apiKey === 'string' ? doc.apiKey : ''
    const masked = key ? `${key.slice(0, 6)}…${key.slice(-4)}` : ''
    const plain = typeof doc?.toObject === 'function' ? doc.toObject() : doc
    return { ...plain, apiKey: masked, apiSecret: undefined }
  })

  return reply.status(200).send(apiKeys)
}
