import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { edenHandlers } from '../src/lib/taskHandlers/edenHandlers'
import { Creation } from '../src/models/Creation'
import { User } from '../src/models/Creator'
import { Generator, GeneratorSchema } from '../src/models/Generator'
import createServer, { CreateServerOpts } from '../src/server'

export const createTestServer = async () => {
  const opts: CreateServerOpts = {
    mongoUri: globalThis.__MONGO_URI__ + 'test',
  }
  const server = await createServer(opts)
  return server
}

export const createEdenServer = async () => {
  const opts: CreateServerOpts = {
    mongoUri: globalThis.__MONGO_URI__ + 'eden',
    taskHandlers: edenHandlers,
  }
  const server = await createServer(opts)
  return server
}

export const getDb = (server: FastifyInstance) => {
  const db = server.mongo.db
  if (!db) {
    throw new Error('No database connection')
  }
  return db
}

export const prepareUserHeaders = () => {
  return {
    'x-api-key': 'user',
    'x-api-secret': 'user',
  }
}

export const prepareAdminHeaders = () => {
  return {
    'x-api-key': 'admin',
    'x-api-secret': 'admin',
  }
}

export const getDefaultUserId = async () => {
  const userResult = await User.findOne({ userId: 'user' })
  return userResult?._id
}

export const getDummyObjectId = () => {
  return new ObjectId(0)
}

export const createGenerator = async (generatorName: string) => {
  const generatorVersionData = {
    versionId: '1.0.0',
    parameters: [
      {
        name: 'guidance_scale',
        label: 'Guidance scale',
        description: 'Strength of prompt conditioning guidance',
        default: 7.5,
        minimum: 0.0,
        maximum: 30.0,
        step: 0.1,
        optional: true,
      },
    ],
    isDeprecated: false,
    provider: 'test',
    mode: 'test',
    address: 'test',
    creationAttributes: [],
    createdAt: new Date(),
  }
  const generator: GeneratorSchema = {
    generatorName,
    description: 'test',
    versions: [generatorVersionData],
    output: 'creation',
  }
  await Generator.create(generator)
  return generator
}

export const createCreation = async () => {
  const creation = await Creation.create({
    user: await getDefaultUserId(),
    task: new ObjectId(0),
    uri: 'test',
    name: 'test',
    attributes: {},
  })
  return creation
}
