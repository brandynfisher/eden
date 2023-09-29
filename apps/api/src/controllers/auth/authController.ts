import { ethers } from 'ethers'
import { FastifyInstance, FastifyReply } from 'fastify'
import { SiweMessage } from 'siwe'

import Challenge from '../../models/Challenge'
import { Collection } from '../../models/Collection'
import { User, UserInput } from '../../models/Creator'
import { Manna } from '../../models/Manna'

export const createNewUser = async (input: UserInput) => {
  const newUser = new User(input)
  await newUser.save()

  // Give them a default collection
  const collection = new Collection({
    user: newUser._id,
    name: 'Bookmarks',
    description: 'My bookmarked creations',
    isDefaultCollection: true,
  })
  await collection.save()

  // Give them free Manna
  const newManna = new Manna({
    user: newUser._id,
    balance: 1000,
  })
  await newManna.save()
  return newUser
}

export const getAuthAllowlist = (server: FastifyInstance) => {
  const allowlist = server.config.AUTH_ALLOWLIST
  if (!allowlist) return null
  return allowlist.split(',')
}

export const validateChallenge = async (
  address: string,
  message: string,
  signature: string,
  reply: FastifyReply,
) => {
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

  const authUser = await User.findOne({
    userId: address,
  })

  return {
    authUser,
    challenge,
  }
}
