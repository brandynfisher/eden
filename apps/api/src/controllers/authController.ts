import {
  AuthCreateChallengeArguments,
  AuthLoginArguments,
} from '@eden-labs/eden-sdk'
import { ethers } from 'ethers'
import { FastifyReply, FastifyRequest } from 'fastify'
import { SiweMessage, generateNonce } from 'siwe'

import Challenge from '../models/Challenge'
import { User, UserInput } from '../models/Creator'
import { Manna } from '../models/Manna'

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  const { address, signature, message } = request.body as AuthLoginArguments

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
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { address, isWeb2 } = request.body as AuthCreateChallengeArguments

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
