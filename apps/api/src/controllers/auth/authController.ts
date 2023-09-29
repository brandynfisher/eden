import { FastifyInstance } from 'fastify'

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
