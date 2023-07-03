import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

import migration01 from './migrations/001_hello-eden.js'

dotenv.config()
const MONGO_URI_DEST = process.env.MONGO_URI_DEST

const client_to = new MongoClient(MONGO_URI_DEST)
await client_to.connect()

await migration01(client_to)
