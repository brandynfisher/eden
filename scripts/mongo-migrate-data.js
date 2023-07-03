import { Client as MinioClient } from 'minio'
import { MongoClient } from 'mongodb'

import migrateData from './data-migrations/001_migrate-data.js'
import addMediaDurations from './data-migrations/002_add-media-durations.js'
import createThumbnails from './data-migrations/003_create-thumbnails.js'

const args = process.argv.slice(2)
const MONGO_URI_SRC = args[0]
const MONGO_URI_DEST = args[1]
const MONGO_URI_SRC_DB = MONGO_URI_SRC.split('/').pop()
const DOC_LIMIT = args[2] ? parseInt(args[2]) : undefined

const minioClient = new MinioClient({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'eden12345',
  secretKey: 'eden12345',
})

const minio = {
  minioClient,
  minioBucket: 'minio-eden',
  minioUri: 'http://localhost:9000/minio-eden',
}

const client_from = new MongoClient(MONGO_URI_SRC)
const client_to = new MongoClient(MONGO_URI_DEST)
await client_from.connect()
await client_to.connect()

console.log('Migrating from ' + MONGO_URI_SRC + ' to ' + MONGO_URI_DEST)

await migrateData(client_from, client_to, MONGO_URI_SRC_DB, DOC_LIMIT)
await addMediaDurations(client_to)
await createThumbnails(client_to, minio)

await client_from.close()
await client_to.close()
