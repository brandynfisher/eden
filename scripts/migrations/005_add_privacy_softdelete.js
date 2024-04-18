import axios from 'axios'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { MediaType } from '@edenlabs/eden-sdk'
import mime from 'mime-types'
import sharp from 'sharp'
import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

const env = process.argv[2];
dotenv.config({ path: `../.env.${env}` });
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is missing');
}
if (!MONGO_DB_NAME) {
  throw new Error('MONGO_DB_NAME environment variable is missing');
}

const BATCH_SIZE = 100

async function addDefaults(db_to, collection, field, defaultValue) {
  try {
    console.log('Adding defaults', collection, field, defaultValue)
    const collections_to = db_to.collection(collection)

    const filterQuery = {}
    filterQuery[field] = { $exists: false }
    const cursor = collections_to.find(filterQuery).batchSize(BATCH_SIZE)

    const fields = {}
    fields[field] = defaultValue

    const processBatch = async (batch) => {
      await Promise.all(
        batch.map(async item => {
          try {
            console.log(collection, field, item._id, item.deleted, item.isPrivate)
            console.log({ _id: item._id }, { $set: fields })
            return collections_to.updateOne(
              { _id: item._id },
              { $set: fields },
            )
          } catch (error) {
            console.error(`Error processing creation ${item._id}:`, error)
          }
        }),
      )
    }

    let batch = []
    for await (const creation of cursor) {
      batch.push(creation)

      if (batch.length === BATCH_SIZE) {
        await processBatch(batch)
        batch = []
      }
    }

    // Process remaining creations in the last batch
    if (batch.length > 0) {
      await processBatch(batch)
    }

    // await getMediaDurationInBatches(allCreations)
  } catch (error) {
    console.error(error)
  }
}

// export default main

async function main2() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    console.log(`Connected successfully to ${MONGO_URI}`);
    const db = await client.db(MONGO_DB_NAME);
    await addDefaults(db, 'collections', 'deleted', false);
    await addDefaults(db, 'collections', 'isPrivate', false);
    await addDefaults(db, 'concepts', 'deleted', false);
    await addDefaults(db, 'concepts', 'isPrivate', false);
  } catch (err) {
    console.error('Failed to connect to the server:', err);
    throw err;
  } finally {
    client.close();
  }
}

main2().catch(err => {
  console.error('An unhandled error occurred:', err);
  process.exit(1);
});
