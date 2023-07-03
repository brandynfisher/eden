import { MongoClient } from 'mongodb'

const url = 'mongodb://eden:eden@localhost:27017/eden'
const dbName = 'eden'

MongoClient.connect(
  url,
  MongoClient.connect(url, function (err, client) {
    if (err) {
      console.error('An error occurred connecting to MongoDB', err)
      return
    }

    const db = client.db(dbName)
    const collection = db.collection('creations')

    collection.find({}).toArray((err, docs) => {
      if (err) {
        console.error('An error occurred fetching the documents', err)
        return
      }

      const counts = {
        mp4: { withThumbnail: 0, withoutThumbnail: 0 },
        jpg: { withThumbnail: 0, withoutThumbnail: 0 },
        jpeg: { withThumbnail: 0, withoutThumbnail: 0 },
      }

      docs.forEach(doc => {
        const uriParts = doc.uri.split('/')
        const lastPart = uriParts[uriParts.length - 1]
        const lastPartSplit = lastPart.split('.')

        if (lastPartSplit.length > 1) {
          const extension = lastPartSplit[lastPartSplit.length - 1]

          if (['mp4', 'jpg', 'jpeg'].includes(extension)) {
            if (doc.thumbnail) {
              counts[extension].withThumbnail++
            } else {
              counts[extension].withoutThumbnail++
            }
          }
        }
      })

      console.log(counts)

      client.close()
    })
  }),
)
