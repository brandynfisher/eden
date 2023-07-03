import axios from 'axios'
import { randomUUID } from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const BATCH_SIZE = 5

async function downloadFile(fileUrl) {
  console.log('Downloading ' + fileUrl)
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' })
  return Buffer.from(response.data, 'binary')
}

const getMediaDuration = async buffer => {
  const tempFilePath = join(tmpdir(), randomUUID())
  await fs.writeFileSync(tempFilePath, buffer)
  const duration = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
      if (err) reject(err)
      else resolve(metadata.format.duration)
    })
  })
  if (!duration) throw new Error('Could not get media duration')
  return duration
}

async function main(client_to) {
  try {
    console.log('Adding media durations...')
    const creations_to = client_to.db('eden').collection('creations')
    const allCreations = await creations_to.find().toArray()

    const durationMedia = allCreations.filter(
      creation =>
        creation.mediaAttributes && creation.mediaAttributes.duration === 0,
    )
    console.log(durationMedia.length)

    const getMediaDurationInBatches = async creations => {
      for (let i = 0; i < creations.length; i += BATCH_SIZE) {
        const batch = creations.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map(async creation => {
            const buffer = await downloadFile(creation.uri)
            const duration = await getMediaDuration(buffer)
            return creations_to.updateOne(
              { _id: creation._id },
              { $set: { 'mediaAttributes.duration': duration } },
            )
          }),
        )
      }
    }

    await getMediaDurationInBatches(durationMedia)
  } catch (error) {
    console.error(error)
  }
}

export default main
