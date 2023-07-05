import axios from 'axios'
import crypto from 'crypto'
import sharp from 'sharp'

const BATCH_SIZE = 10

async function main(db_to, minio) {
  const { minioClient, minioBucket, minioUri } = minio
  const sha256 = data => {
    const hashSum = crypto.createHash('sha256')
    hashSum.update(data)
    return hashSum.digest('hex')
  }

  const uploadBufferAsset = async buffer => {
    const sha = sha256(buffer)
    const ext = 'webp'
    const mime = 'image/webp'
    const metadata = { 'Content-Type': mime, SHA: sha }
    const filename = `${sha}.${ext}`
    const urlUpload = `${minioUri}/${filename}`
    try {
      await minioClient.statObject(minioBucket, filename)
      console.log(
        ` --> Object ${filename} already exists in ${minioBucket}, skipping upload`,
      )
    } catch (error) {
      await minioClient.putObject(minioBucket, filename, buffer, metadata)
      console.log(` --> Uploaded to ${urlUpload}`)
    }
    return urlUpload
  }

  const uploadThumbnailAsset = async assetInput => {
    let assetB64
    if (typeof assetInput === 'string') {
      const asset = await axios.get(assetInput, { responseType: 'arraybuffer' })
      assetB64 = Buffer.from(asset.data, 'base64')
    } else {
      assetB64 = assetInput
    }

    const resizedBuffer = await sharp(assetB64)
      .resize({ width: 500, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const uri = await uploadBufferAsset(resizedBuffer)
    return uri
  }

  try {
    console.log('Creating thumbnails...')
    const creations_to = db_to.collection('creations')
    const allCreations = await creations_to.find().toArray()

    const visualMedia = allCreations.filter(creation => !!creation.thumbnail)

    const getThumbnailInBatches = async creations => {
      for (let i = 0; i < creations.length; i += BATCH_SIZE) {
        const batch = creations.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map(async creation => {
            const thumbnail = await uploadThumbnailAsset(creation.thumbnail)
            return creations_to.updateOne(
              { _id: creation._id },
              { $set: { thumbnail } },
            )
          }),
        )
      }
    }

    await getThumbnailInBatches(visualMedia)
  } catch (error) {
    console.error(error)
  }
}

export default main
