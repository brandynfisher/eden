import { MongoClient } from 'mongodb'

const args = process.argv.slice(2)
const MONGO_URI_SRC = args[0]
const MONGO_URI_DEST = args[1]
const MONGO_URI_SRC_DB = MONGO_URI_SRC.split('/').pop()

const client_from = new MongoClient(MONGO_URI_SRC)
const client_to = new MongoClient(MONGO_URI_DEST)

console.log('Migrating from ' + MONGO_URI_SRC + ' to ' + MONGO_URI_DEST)

async function main() {
  try {
    await client_from.connect()
    await client_to.connect()

    console.log('Copying tasks...')
    const tasks_from = client_from.db(MONGO_URI_SRC_DB).collection('tasks')
    const tasks_to = client_to.db('eden').collection('tasks')
    const allTasks = await tasks_from.find().toArray()
    allTasks.forEach(task => {
      if (task.output?.file) {
        task.output.files = [task.output.file]
        delete task.output.file
      }
      if (task.output?.thumbnail) {
        task.output.thumbnails = [task.output.thumbnail]
        delete task.output.thumbnail
      }
    })
    await tasks_to.insertMany(allTasks)

    console.log('Copying loras...')
    const loras_from = client_from.db(MONGO_URI_SRC_DB).collection('loras')
    const loras_to = client_to.db('eden').collection('loras')
    const allLoras = await loras_from.find().toArray()
    await loras_to.insertMany(allLoras)

    console.log('Copying apiKeys...')
    const apiKeys_from = client_from.db(MONGO_URI_SRC_DB).collection('apikeys')
    const apiKeys_to = client_to.db('eden').collection('apikeys')
    const allApiKeys = await apiKeys_from.find().toArray()
    allApiKeys.forEach(apiKey => {
      delete apiKey.deleted
    })
    await apiKeys_to.insertMany(allApiKeys)

    console.log('Copying creations...')
    const creations_from = client_from
      .db(MONGO_URI_SRC_DB)
      .collection('creations')
    const creations_to = client_to.db('eden').collection('creations')
    const allCreations = await creations_from.find().toArray()
    allCreations.forEach(creation => {
      creation.media = null // tbd
      creation.mediaAttributes = null // tbd
    })
    await creations_to.insertMany(allCreations)

    console.log('Copying creators...')
    const creators_from = client_from.db(MONGO_URI_SRC_DB).collection('users')
    const creators_to = client_to.db('eden').collection('users')
    const allCreators = await creators_from.find().toArray()
    allCreators.forEach(creation => {
      creation.isWeb2 = !creation.isWallet
      delete creation.isWallet
    })

    await creators_to.insertMany(allCreators)

    console.log('Finished migrating all collections')
  } catch (error) {
    console.error(error)
  } finally {
    await client_from.close()
    await client_to.close()
    console.log('Disconnected from the database')
  }
}

main()
