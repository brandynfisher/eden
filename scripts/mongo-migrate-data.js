import dotenv from 'dotenv'
import { Client as MinioClient } from 'minio'
import { MongoClient } from 'mongodb'

import migrateData from './data-migrations/001_migrate-data.js'
import addMediaDurations from './data-migrations/002_add-media-durations.js'
import createThumbnails from './data-migrations/003_create-thumbnails.js'

dotenv.config()
const MONGO_URI_SRC = process.env.MONGO_URI_SRC
const MONGO_URI_DEST = process.env.MONGO_URI_DEST
const MONGO_URI_SRC_DB = MONGO_URI_SRC.split('/').pop()
const MONGO_URI_DEST_DB = MONGO_URI_DEST.split('/').pop()

let minioClient
if (process.env.MINIO_PORT) {
  minioClient = new MinioClient({
    endPoint: process.env.MINIO_HOST,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  })
} else {
  minioClient = new MinioClient({
    endPoint: process.env.MINIO_HOST,
    accessKey: process.env.MINIO_ACCESS_KEY,
    // secretKey: process.env.MINIO_SECRET_KEY,
    secretKey: 'Start123$'
  })
}

const minio = {
  minioClient,
  minioBucket: process.env.MINIO_BUCKET,
  minioUri: process.env.MINIO_URI,
}

console.log(minio)

const args = process.argv.slice(1)
const DOC_LIMIT = args[1] ? parseInt(args[1]) : undefined

const client_from = new MongoClient(MONGO_URI_SRC)
const client_to = new MongoClient(MONGO_URI_DEST)
await client_from.connect()
await client_to.connect()
const db_from = client_from.db(MONGO_URI_SRC_DB)
const db_to = client_to.db(MONGO_URI_DEST_DB)

console.log('Migrating from ' + MONGO_URI_SRC + ' to ' + MONGO_URI_DEST)

// await migrateData(db_from, db_to, MONGO_URI_SRC_DB, DOC_LIMIT)
// await addMediaDurations(db_to)
await createThumbnails(db_to, minio)

await client_from.close()
await client_to.close()
