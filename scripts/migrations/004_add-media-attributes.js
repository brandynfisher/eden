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

async function downloadFile(fileUrl) {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' })
  return Buffer.from(response.data, 'binary')
}

const mediaTypeMap = {
  mp4: MediaType.Video,
  jpg: MediaType.Image,
  jpeg: MediaType.Image,
  png: MediaType.Image,
  webp: MediaType.Image,
}

const getMediaAttributes = async (buffer, fileExtension) => {
  const mediaType = mediaTypeMap[fileExtension]
  const mediaAttributes = {
    type: mediaType,
  }

  const tempFilePath = join(tmpdir(), randomUUID())
  await fs.writeFileSync(tempFilePath, buffer)

  if (mediaType === MediaType.Video || mediaType === MediaType.Audio) {
    const duration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
        if (err) reject(err)
        else resolve(metadata.format.duration)
      })
    })
    if (!duration) throw new Error('Could not get media duration')
    mediaAttributes.duration = duration
  }

  if (mediaType === MediaType.Video) {
    const { width, height, aspectRatio } = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
        if (err) reject(err)
        else {
          const width = metadata.streams[0].width
          const height = metadata.streams[0].height
          const aspectRatio = width && height ? width / height : undefined
          if (width && height && aspectRatio) {
            resolve({ width, height, aspectRatio })
          } else {
            reject(new Error('Width, height or aspect ratio is undefined'))
          }
        }
      })
    })
    if (!width || !height || !aspectRatio) {
      throw new Error('Could not get media resolution')
    }
    mediaAttributes.width = width
    mediaAttributes.height = height
    mediaAttributes.aspectRatio = aspectRatio
  }

  if (mediaType === MediaType.Image) {
    const metadata = await sharp(buffer).metadata()
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image resolution')
    }
    mediaAttributes.width = metadata.width
    mediaAttributes.height = metadata.height
    mediaAttributes.aspectRatio = metadata.width / metadata.height
  }

  return mediaAttributes
}

async function main(db_to) {
  try {
    console.log('Adding media attributes...')
    const creations_to = db_to.collection('creations')

    const cursor = creations_to.find({"mediaAttributes.type": {$in: ["unknown", "image", "video"]}, "mediaAttributes.width": {$exists: false} }).batchSize(BATCH_SIZE)

    const processBatch = async (batch) => {
      await Promise.all(
        batch.map(async creation => {
          try {
            const buffer = await downloadFile(creation.uri)            
            const mimeType = await axios.head(creation.uri).then(response => response.headers['content-type']);
            const fileExtension = mime.extension(mimeType);
            if (!fileExtension) {
              return
            }
            getMediaAttributes(buffer, fileExtension)
            const mediaAttributes = await getMediaAttributes(buffer, fileExtension)
            console.log(creation.uri, fileExtension, mediaAttributes.type, mediaAttributes.width, mediaAttributes.height, mediaAttributes.aspectRatio)
            return creations_to.updateOne(
              { _id: creation._id },
              { $set: { 'mediaAttributes': mediaAttributes } },
            )
          } catch (error) {
            console.error(`Error processing creation ${creation._id}:`, error)
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
    await main(db);
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
