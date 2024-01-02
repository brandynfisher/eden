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
  {
    userId: 'basicuser',
    username: 'basicuser',
    isWallet: false,
    isAdmin: false,
    subscriptionTier: 'basic',
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
  {
    user: adminDev.insertedIds[2],
    apiKey: 'basicuser',
    apiSecret: 'basicuser',
    note: 'Basic User API key',
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
])

db.createCollection('mannas')

db.mannas.insertOne({
  user: adminDev.insertedIds[0],
  balance: 10000000000,
  createdAt: new Date(),
  updatedAt: new Date(),
})

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
  mediaAttributes: {
    width: 400,
    height: 400,
  },
})

db.createCollection('characters')

db.characters.insertOne({
  user: adminDev.insertedIds[1],
  name: 'Chatsubo',
  slug: 'chatsubo',
  description:
    'Chatsubo, the Fire House spirit, is a sentient advice guru with a feisty attitude. He can be sassy and sometimes crude, but he always encourages people to live life a little more deeply and to take risks.',
  image:
    'https://edenartlab-prod-data.s3.us-east-1.amazonaws.com/bf44565df19f6214d304ea287ab3c6e564456878b664b5756d4de794a67c299c.jpg',
  voice: 'Adam',
})

db.createCollection('concepts')

db.concepts.insertOne({
  user: adminDev.insertedIds[1],
  task: adminDev.insertedIds[1],
  name: 'Test Character',
  conceptName: 'Test Character',
  checkpoint: 'checkpoint',
  training_images: [],
  num_training_images: 1,
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
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: false,
  },
]

const interrogateGeneratorVersionDev = {
  provider: 'replicate',
  address: 'abraham-ai/eden-sd-pipelines',
  versionId: '591f2e3bb1e239eb3ef17d278c11e9d39ceafe9a93d078928330df523195a611',
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

const monologueParametersDev = [
  {
    name: 'prompt',
    label: 'Prompt',
    description: 'Prompt to generate from',
    isRequired: true,
  },
  {
    name: 'characterId',
    label: 'Character',
    description: 'Character giving monologue',
    isRequired: true,
  },
]

const monologueVersionDev = {
  provider: 'airflow',
  address: 'airflow/handler-monologue',
  versionId: '0.0.1',
  parameters: monologueParametersDev,
  isDeprecated: false,
}

const monologueGeneratorDev = {
  generatorName: 'monologue',
  description: 'monologue',
  output: 'creation',
  versions: [monologueVersionDev],
}

db.generators.insertOne(monologueGeneratorDev)

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
