async function main(db_from, db_to, MONGO_URI_SRC_DB, DOC_LIMIT) {
  const getMediaAttributes = doc => {
    if (!doc.uri) {
      return {
        type: 'unknown',
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
            type: 'image',
          }
        case 'jpeg':
          return {
            type: 'image',
          }
        case 'mp4':
          return {
            type: 'video',
            duration: 0,
          }
        case 'wav':
          return {
            type: 'audio',
            duration: 0,
          }
        case 'txt':
          return {
            type: 'text',
          }
        default:
          return {
            type: 'unknown',
          }
      }
    } else {
      return {
        type: 'unknown',
      }
    }
  }

  const selectDocs = async (collectionName, useDocLimit) => {
    const collection_from = db_from.collection(collectionName)
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
    console.log('Copying generators...')
    const allGenerators = await selectDocs('generators')
    const generators_to = db_to.collection('generators')
    await generators_to.insertMany(allGenerators)

    console.log('Copying tasks...')
    const allTasks = await selectDocs('tasks', true)
    const tasks_to = db_to.collection('tasks')

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

    // console.log('Copying concepts...')
    // const allConcepts = await selectDocs('concepts')
    // const concepts_to = db_to.collection('concepts')
    // await concepts_to.insertMany(allConcepts)

    console.log('Copying creations...')
    const allCreations = await selectDocs('creations', true)
    const creations_to = db_to.collection('creations')

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
    const creators_to = db_to.collection('users')
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
    const collections_to = db_to.collection('collections')
    await collections_to.insertMany(allCollections)

    // Populate 'collections' and 'creations' for each user
    console.log('Populating user stuff...')
    const users_to = db_to.collection('users')

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

    console.log('Populating Manna for existing users...')

    const updatePromises2 = allCreators.map(user => {
      return db_to.collection('mannas').insertOne({
        user: user._id,
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    await Promise.all(updatePromises2)

    console.log('Finished migrating all collections')
  } catch (error) {
    console.error(error)
  }
}

export default main
