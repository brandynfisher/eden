db = db.getSiblingDB('eden-dummy')

db.createUser({
  user: 'eden',
  pwd: 'eden',
  roles: [
    {
      role: 'readWrite',
      db: 'eden-dummy',
    },
  ],
})

db.createCollection('users')

adminDev = db.users.insertMany([
  {
    userId: 'admin',
    username: 'admin',
    isWallet: false,
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    userId: 'user',
    username: 'user',
    isWallet: false,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
])

db.createCollection('apikeys')

db.apikeys.insertMany([
  {
    user: adminDev.insertedIds[0],
    apiKey: 'admin',
    apiSecret: 'admin',
    note: 'Admin API key',
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    user: adminDev.insertedIds[1],
    apiKey: 'user',
    apiSecret: 'user',
    note: 'User API key',
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
])

db.createCollection('mannas')

db.mannas.insertOne({
  user: adminDev.insertedIds[1],
  balance: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
})

db.createCollection('creations')

db.creations.insertOne({
  user: adminDev.insertedIds[1],
  task: adminDev.insertedIds[1],
  uri: 'uri',
  name: 'Test Creation',
  attributes: {},
})

db.createCollection('characters')

db.characters.insertOne({
  user: adminDev.insertedIds[1],
  task: adminDev.insertedIds[1],
  name: 'Test Character',
  checkpoint: 'checkpoint',
  training_images: [],
  uri: 'uri',
})

db.createCollection('loras')

db.loras.insertOne({
  user: adminDev.insertedIds[1],
  task: adminDev.insertedIds[1],
  name: 'Test Character',
  checkpoint: 'checkpoint',
  training_images: [],
  uri: 'uri',
})

db.createCollection('generators')

const interrogateParametersDev = [
  {
    name: 'test',
    label: 'Image',
    description:
      'URL of image to initiate image before diffusion (if null, use random noise)',
    default: 'x',
    mediaUpload: false,
    isRequired: false,
  },
]

const interrogateGeneratorVersionDev = {
  provider: 'replicate',
  address: 'abraham-ai/eden-sd-pipelines',
  versionId: '591f2e3bb1e239eb3ef17d278c11e9d39ceafe9a93d078928330df523195a611',
  mode: 'interrogate',
  parameters: interrogateParametersDev,
  isDeprecated: false,
}

const interrogateGeneratorDev = {
  generatorName: 'test',
  description: 'test',
  output: 'creation',
  versions: [interrogateGeneratorVersionDev],
}

db.generators.insertOne(interrogateGeneratorDev)

db = db.getSiblingDB('eden')

db.createUser({
  user: 'eden',
  pwd: 'eden',
  roles: [
    {
      role: 'readWrite',
      db: 'eden',
    },
  ],
})
