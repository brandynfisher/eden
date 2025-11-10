import { ApiKey, ApiKeyInput } from '../../src/models/ApiKey'
import { Collection } from '../../src/models/Collection'
import { Manna } from '../../src/models/Manna'
import { User, UserInput } from '../../src/models/User'
import {
  createCharacter,
  createCreation,
  createGenerator,
  getDefaultUserId,
} from '../util'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { setup, teardown } from 'vitest-mongodb'

const createAdmin = async () => {
  const userData: UserInput = {
    userId: 'admin',
    username: 'admin',
    isWeb2: false,
    isAdmin: true,
    email: 'admin@eden.test',
    normalizedEmail: 'admin@eden.test',
  }
  const user = new User(userData)
  user.eden_user_id = user._id
  await user.save()

  const apiKeyData: ApiKeyInput = {
    apiKey: 'admin',
    apiSecret: 'admin',
    user: user._id,
  }

  const apiKey = new ApiKey(apiKeyData)
  await apiKey.save()

  const adminManna = {
    user: user._id,
    balance: 1000,
  }

  const manna = new Manna(adminManna)
  await manna.save()
}

const createFreeUser = async () => {
  const userData: UserInput = {
    userId: 'user',
    username: 'user',
    isWeb2: false,
    isAdmin: false,
    email: 'user@eden.test',
    normalizedEmail: 'user@eden.test',
  }
  const user = new User(userData)
  user.eden_user_id = user._id
  await user.save()

  const apiKeyData: ApiKeyInput = {
    apiKey: 'user',
    apiSecret: 'user',
    user: user._id,
  }
  const apiKey = new ApiKey(apiKeyData)
  await apiKey.save()

  const userManna = {
    user: user._id,
    balance: 1000,
  }
  const manna = new Manna(userManna)
  await manna.save()
}

const createBasicUser = async () => {
  const userData: UserInput = {
    userId: 'basicuser',
    username: 'basicuser',
    isWeb2: false,
    isAdmin: false,
    email: 'basicuser@eden.test',
    normalizedEmail: 'basicuser@eden.test',
  }
  const user = new User(userData)
  user.eden_user_id = user._id
  user.subscriptionTier = SubscriptionTier.Basic
  await user.save()

  const apiKeyData: ApiKeyInput = {
    apiKey: 'basicuser',
    apiSecret: 'basicuser',
    user: user._id,
  }
  const apiKey = new ApiKey(apiKeyData)
  await apiKey.save()

  const userManna = {
    user: user._id,
    balance: 1000,
  }
  const manna = new Manna(userManna)
  await manna.save()
}

const createProUser = async () => {
  const userData: UserInput = {
    userId: 'prouser',
    username: 'prouser',
    isWeb2: false,
    isAdmin: false,
    email: 'prouser@eden.test',
    normalizedEmail: 'prouser@eden.test',
  }
  const user = new User(userData)
  user.eden_user_id = user._id
  user.subscriptionTier = SubscriptionTier.Pro
  await user.save()

  const apiKeyData: ApiKeyInput = {
    apiKey: 'prouser',
    apiSecret: 'prouser',
    user: user._id,
  }
  const apiKey = new ApiKey(apiKeyData)
  await apiKey.save()

  const userManna = {
    user: user._id,
    balance: 1000,
  }
  const manna = new Manna(userManna)
  await manna.save()
}

const createBelieverUser = async () => {
  const userData: UserInput = {
    userId: 'believeruser',
    username: 'believeruser',
    isWeb2: false,
    isAdmin: false,
    email: 'believeruser@eden.test',
    normalizedEmail: 'believeruser@eden.test',
  }
  const user = new User(userData)
  user.eden_user_id = user._id
  user.subscriptionTier = SubscriptionTier.Believer
  await user.save()

  const apiKeyData: ApiKeyInput = {
    apiKey: 'believeruser',
    apiSecret: 'believeruser',
    user: user._id,
  }
  const apiKey = new ApiKey(apiKeyData)
  await apiKey.save()

  const userManna = {
    user: user._id,
    balance: 1000,
  }
  const manna = new Manna(userManna)
  await manna.save()
}

const createPreviewUser = async () => {
  const userData: UserInput = {
    userId: 'previewUser',
    username: 'previewUser',
    isWeb2: false,
    isAdmin: false,
    email: 'previewuser@eden.test',
    normalizedEmail: 'previewuser@eden.test',
  }
  const user = new User(userData)
  user.eden_user_id = user._id
  user.featureFlags = [FeatureFlag.Preview]
  await user.save()

  const apiKeyData: ApiKeyInput = {
    apiKey: 'previewuser',
    apiSecret: 'previewuser',
    user: user._id,
  }
  const apiKey = new ApiKey(apiKeyData)
  await apiKey.save()

  const userManna = {
    user: user._id,
    balance: 1000,
  }
  const manna = new Manna(userManna)
  await manna.save()
}

const createCollection = async () => {
  const user = await getDefaultUserId()
  const collection = {
    name: 'bookmarks',
    isDefaultCollection: true,
    user,
  }
  await Collection.create(collection)
}

beforeAll(async () => {
  await setup()
  process.env.MONGO_URI = globalThis.__MONGO_URI__
  const client = new MongoClient(globalThis.__MONGO_URI__)
  client.db('eden')
  mongoose.set('strictQuery', true)
  await mongoose.connect(process.env.MONGO_URI as string)
})

beforeEach(async () => {
  await createAdmin()
  await createFreeUser()
  await createBasicUser()
  await createProUser()
  await createBelieverUser()
  await createPreviewUser()
  await createGenerator('test')
  await createCreation()
  await createCollection()
  await createCharacter()
})

afterEach(async () => {
  // delete all existing data
  const collections = await mongoose.connection.db.collections()
  for (const collection of collections) {
    await collection.deleteMany({})
  }
})

afterAll(async () => {
  // delete all existing data
  await teardown()
})
