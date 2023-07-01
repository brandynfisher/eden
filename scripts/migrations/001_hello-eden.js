import { MongoClient } from 'mongodb'

import createParameters from '../generators/create.js'
import interpolationParameters from '../generators/interpolate.js'
import real2realParameters from '../generators/real2real.js'
import remixParameters from '../generators/remix.js'

const main = async () => {
  const args = process.argv.slice(1)
  const MONGO_URI_SRC = args[1]
  console.log('Writing to: ' + MONGO_URI_SRC)

  const client = new MongoClient(MONGO_URI_SRC)
  const db = client.db('eden')

  await db.createCollection('users')

  const admin = await db.collection('users').insertMany([
    {
      userId: 'admin',
      username: 'admin',
      isWeb2: false,
      isAdmin: true,
    },
  ])

  await db.createCollection('apikeys')

  await db.collection('apikeys').insertMany([
    {
      user: admin.insertedIds[0],
      apiKey: 'admin',
      apiSecret: 'admin',
      note: 'Admin API key',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  const provider = 'replicate'
  const address = 'abraham-ai/eden-sd-pipelines'
  const versionId =
    'f6b205fc1b2acbd86441619f2193892c347a775a5c46b192978758c79e0c1ef1'

  // Register generators
  const createGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'generate',
    parameters: createParameters,
    isDeprecated: false,
  }

  const createGenerator = {
    generatorName: 'create',
    description: 'Create an image from a prompt',
    output: 'creation',
    versions: [createGeneratorVersion],
  }

  const interpolateGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'interpolate',
    parameters: interpolationParameters,
    isDeprecated: false,
  }

  const interpolateGenerator = {
    generatorName: 'interpolate',
    description: 'Create a video interpolation between two prompts',
    output: 'creation',
    versions: [interpolateGeneratorVersion],
  }

  const real2realGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'real2real',
    parameters: real2realParameters,
    isDeprecated: false,
  }

  const real2realGenerator = {
    generatorName: 'real2real',
    description: 'Create a video interpolation between two images',
    output: 'creation',
    versions: [real2realGeneratorVersion],
  }

  const remixGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'remix',
    parameters: remixParameters,
    isDeprecated: false,
  }

  const remixGenerator = {
    generatorName: 'remix',
    description: 'Generate a remix of an image',
    output: 'creation',
    versions: [remixGeneratorVersion],
  }

  await db.createCollection('generators')

  await db
    .collection('generators')
    .insertMany([
      createGenerator,
      interpolateGenerator,
      real2realGenerator,
      remixGenerator,
    ])

  client.close()
}

export default main
