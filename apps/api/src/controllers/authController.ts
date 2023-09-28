import {
  AuthCreateChallengeArguments,
  AuthLoginArguments,
} from '@edenlabs/eden-sdk'
import { ethers } from 'ethers'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { SiweMessage, generateNonce } from 'siwe'

import Challenge from '../models/Challenge'
import { Collection } from '../models/Collection'
import { User, UserInput } from '../models/Creator'
import { Manna } from '../models/Manna'

const getAuthAllowlist = (server: FastifyInstance) => {
  const allowlist = server.config.AUTH_ALLOWLIST
  if (!allowlist) return null
  return allowlist.split(',')
}

export const login = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { address, signature, message } = request.body as AuthLoginArguments

  const allowlist = getAuthAllowlist(server)
  if (allowlist && !allowlist.includes(address)) {
    return reply.status(401).send({
      message: 'Address not in allowlist',
    })
  }

  // first, find the most recent challenge for this address
  const challenge = await Challenge.findOne({
    address,
  }).sort({ createdAt: -1 })

  if (!challenge) {
    return reply.status(400).send({
      message: 'No challenge found for this address',
    })
  }

  // Verify the challenge has not expired
  if (challenge.expiresAt < new Date()) {
    return reply.status(400).send({
      message: 'Challenge has expired',
    })
  }

  // Verify the challenge has not been acknowledged
  if (challenge.ack) {
    return reply.status(400).send({
      message: 'Challenge has already been used',
    })
  }

  // verify the signature
  const recovered = ethers.utils.verifyMessage(message, signature)

  if (address.toLowerCase() !== recovered.toLowerCase()) {
    return reply.status(400).send({
      message: 'Signature is invalid',
    })
  }

  // check that the nonce matches
  const { nonce } = new SiweMessage(message)

  if (nonce !== challenge.nonce) {
    return reply.status(400).send({
      message: 'Nonce does not match',
    })
  }

  let authUser = await User.findOne({
    userId: address,
  })

  // create a new user if none found
  if (!authUser) {
    const userInput: UserInput = {
      userId: address,
      username: address,
      isWeb2: challenge.isWeb2,
    }
    const newUser = new User(userInput)
    await newUser.save()
    authUser = newUser

    // Give them a default collection
    const collection = new Collection({
      user: authUser._id,
      name: 'Bookmarks',
      description: 'My bookmarked creations',
      isDefaultCollection: true,
    })
    await collection.save()

    // Give them free Manna
    const newManna = new Manna({
      user: authUser._id,
      balance: 1000,
    })
    await newManna.save()
  }

  const token = await reply.jwtSign({
    userId: authUser._id,
    isAdmin: false,
  })

  // mark the challenge as acknowledged
  challenge.ack = true
  await challenge.save()

  return reply.status(200).send({
    token,
  })
}

export const createChallenge = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { address, isWeb2 } = request.body as AuthCreateChallengeArguments
  console.log('address', address)

  const allowlist = getAuthAllowlist(server)
  if (allowlist && !allowlist.includes(address)) {
    return reply.status(401).send({
      message: 'Address not in allowlist',
    })
  }

  const nonce = generateNonce()

  await Challenge.create({
    address,
    isWeb2,
    nonce,
  })

  return reply.status(200).send({
    nonce,
  })
}

export const luciaSignup = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply.status(200).send({
    token: 'lucia',
  })
}

export const luciaLogin = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply.status(200).send({
    token: 'lucia',
  })
}

export const luciaLogout = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const authRequest = server.auth.handleRequest(request, reply)
  const session = await authRequest.validate() // or `authRequest.validateBearerToken()`
  if (!session) {
    return res.sendStatus(401)
  }
  await auth.invalidateSession(session.sessionId)

  authRequest.setSession(null) // for session cookie

  // redirect back to login page
  return res.status(302).setHeader('Location', '/login').end()
}
