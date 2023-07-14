import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

import migration01 from './migrations/001_hello-eden.js'

dotenv.config()
const MONGO_URI_DEST = process.env.MONGO_URI_DEST
const MONGO_URI_DEST_DB = MONGO_URI_DEST.split('/').pop()

const ADMIN_API_KEY = process.env.ADMIN_API_KEY
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET

const client_to = new MongoClient(MONGO_URI_DEST)
await client_to.connect()
const db_to = client_to.db(MONGO_URI_DEST_DB)

await migration01(db_to, ADMIN_API_KEY, ADMIN_API_SECRET)

await client_to.close()
