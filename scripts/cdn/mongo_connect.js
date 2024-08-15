import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dotenv.config()
const MONGO_URI = process.env.MONGO_URI
const MONGO_DB_NAME = process.env.MONGO_DB_NAME
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME

const args = process.argv.slice(1)
const DRY_RUN = !(args[1] && args[1] === 'DRY_RUN=false')
console.log({DRY_RUN})

const client = new MongoClient(MONGO_URI)
await client.connect()
console.log(``)
console.log(`MongoClient: Connected to ${MONGO_URI}`)

const db = client.db(MONGO_DB_NAME)
console.log(`MongoClient: Selected DB ${MONGO_DB_NAME}`)
console.log(``)

export {
  client,
  db,
  DRY_RUN,
  MONGO_URI,
  MONGO_DB_NAME,
  CLOUDINARY_CLOUD_NAME,
  AWS_BUCKET_NAME,
}