async function main(client_from, client_to, MONGO_URI_SRC_DB, DOC_LIMIT) {
  const getMediaAttributes = doc => {
    if (!doc.uri) {
      return {
        mediaType: 'unknown',
      }
    }
    const uriParts = doc.uri.split('/')
    const lastPart = uriParts[uriParts.length - 1]
    const lastPartSplit = lastPart.split('.')

    if (lastPartSplit.length > 1) {
      const extension = lastPartSplit[lastPartSplit.length - 1]
      switch (extension) {
        case 'jpg':
          return {
            mediaType: 'image',
          }
        case 'jpeg':
          return {
            mediaType: 'image',
          }
        case 'mp4':
          return {
            mediaType: 'video',
            duration: 0,
          }
        case 'wav':
          return {
            mediaType: 'audio',
            duration: 0,
          }
        case 'txt':
          return {
            mediaType: 'text',
          }
        default:
          return {
            mediaType: 'unknown',
          }
      }
    } else {
      return {
        mediaType: 'unknown',
      }
    }
  }

  const selectDocs = async (collectionName, useDocLimit) => {
    const collection_from = client_from
      .db(MONGO_URI_SRC_DB)
      .collection(collectionName)
    if (DOC_LIMIT && useDocLimit) {
      return await collection_from
        .find()
        .sort({ createdAt: -1 })
        .limit(DOC_LIMIT)
        .toArray()
    } else {
      return await collection_from.find().toArray()
    }
  }

  try {
    console.log('Copying tasks...')
    const allTasks = await selectDocs('tasks', true)
    const tasks_to = client_to.db('eden').collection('tasks')

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
    const allLoras = await selectDocs('loras')
    const loras_to = client_to.db('eden').collection('loras')
    await loras_to.insertMany(allLoras)

    console.log('Copying apiKeys...')
    const allApiKeys = await selectDocs('apikeys')
    const apiKeys_to = client_to.db('eden').collection('apikeys')
    allApiKeys.forEach(apiKey => {
      delete apiKey.deleted
    })
    await apiKeys_to.insertMany(allApiKeys)

    console.log('Copying creations...')
    const allCreations = await selectDocs('creations', true)
    const creations_to = client_to.db('eden').collection('creations')

    allCreations.map(creation => {
      creation.delegate = null
      creation.mediaAttributes = getMediaAttributes(creation)
      creation.praiseCount = 0
      creation.bookmarkCount = 0
      delete creation.delegateHasClaimed
    })
    await creations_to.insertMany(allCreations)

    console.log('Copying creators...')
    const allCreators = await selectDocs('users')
    const creators_to = client_to.db('eden').collection('users')
    allCreators.forEach(creation => {
      creation.isWeb2 = !creation.isWallet
      delete creation.isWallet
    })

    await creators_to.insertMany(allCreators)

    // Make a default collection for all existing users
    console.log('Making default collections...')
    let allCollections = []
    allCreators.forEach(async creator => {
      const collection = {
        user: creator._id,
        name: 'Bookmarks',
        description: 'My bookmarked creations',
        isDefaultCollection: true,
      }
      allCollections.push(collection)
    })
    const collections_to = client_to.db('eden').collection('collections')
    await collections_to.insertMany(allCollections)

    // Populate 'collections' and 'creations' for each user
    console.log('Populating user stuff...')
    const users_to = client_to.db('eden').collection('users')

    const updatePromises = allCreators.map(user => {
      user.creations = allCreations.filter(
        creation => creation.user === user._id,
      )
      user.collections = allCollections.filter(
        collection => collection.user === user._id,
      )

      return users_to.updateOne(
        { _id: user._id },
        {
          $set: {
            creations: user.creations.map(creation => creation._id),
            collections: user.collections.map(collection => collection._id),
          },
        },
      )
    })

    await Promise.all(updatePromises)

    console.log('Finished migrating all collections')
  } catch (error) {
    console.error(error)
  }
}

export default main
