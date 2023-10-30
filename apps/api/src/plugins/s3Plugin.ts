import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
import AWS from 'aws-sdk'
import axios from 'axios'
import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'

import * as util from '../lib/util'

export interface Asset {
  uri: string
  assetBuffer: Buffer
  mediaAttributes: MediaAttributes
}

const mediaTypeMap: Record<string, MediaType> = {
  mp4: MediaType.Video,
  jpg: MediaType.Image,
  jpeg: MediaType.Image,
  png: MediaType.Image,
  webp: MediaType.Image,
  zip: MediaType.Zip,
}

const getMediaAttributes = async (
  buffer: Buffer,
  fileExtension: string,
): Promise<MediaAttributes> => {
  const mediaType = mediaTypeMap[fileExtension]
  const mediaAttributes: MediaAttributes = {
    type: mediaType,
  }

  const tempFilePath = join(tmpdir(), randomUUID())
  await fs.writeFileSync(tempFilePath, buffer)

  if (mediaType === MediaType.Video || mediaType === MediaType.Audio) {
    const duration = await new Promise<number | undefined>(
      (resolve, reject) => {
        ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
          if (err) reject(err)
          else resolve(metadata.format.duration)
        })
      },
    )
    if (!duration) throw new Error('Could not get media duration')
    mediaAttributes.duration = duration
  }

  if (mediaType === MediaType.Video) {
    const { width, height, aspectRatio } = await new Promise<{
      width: number
      height: number
      aspectRatio: number
    }>((resolve, reject) => {
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

  await fs.unlinkSync(tempFilePath)

  return mediaAttributes
}

export const uploadUrlAsset = async (
  server: FastifyInstance,
  url: string,
  fileExtension: string | null = null,
): Promise<Asset> => {
  const asset = await axios.get(url, { responseType: 'arraybuffer' })
  const assetB64 = Buffer.from(asset.data, 'base64')
  const { uri, mediaAttributes } = await uploadBufferAsset(
    server,
    assetB64,
    fileExtension,
  )
  return {
    uri,
    assetBuffer: assetB64,
    mediaAttributes,
  }
}

export const uploadThumbnailAsset = async (
  server: FastifyInstance,
  assetInput: string | Buffer,
) => {
  let assetB64: Buffer
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

  const { uri } = await uploadBufferAsset(server, resizedBuffer, 'webp')
  return uri
}

export const uploadBufferAsset = async (
  server: FastifyInstance,
  buffer: Buffer,
  fileExtension: string | null = null,
): Promise<{ uri: string; mediaAttributes: MediaAttributes }> => {
  console.log('let us upload this buffer')
  console.log(buffer)
  const client = server.s3
  const S3_BUCKET = server.config.AWS_S3_BUCKET as string
  const sha = util.sha256(buffer)
  console.log('got sha', sha)
  const fileType = await fileTypeFromBuffer(buffer)
  console.log('got fileType', fileType)
  const { ext, mime } = fileType
    ? (fileType as { ext: string; mime: string })
    : { ext: 'txt', mime: 'text/plain' }
  console.log('mine', ext, mime)
  const metadata = { 'Content-Type': mime, SHA: sha }
  const filename = `${sha}.${fileExtension || ext}`
  const urlUpload = s3Url(server, filename)
  console.log('upload to ', urlUpload)

  console.log('the whole config')
  console.log('0-00-')
  try {
    await client.headObject({ Bucket: S3_BUCKET, Key: filename }).promise()
    console.log(
      ` --> Object ${filename} already exists in ${S3_BUCKET}, skipping upload`,
    )
  } catch (error) {
    console.log(' ---> uploading buffer ', filename, metadata, buffer)
    await client
      .putObject({
        Bucket: S3_BUCKET,
        Key: filename,
        Body: buffer,
        Metadata: metadata,
        ContentType: mime,
      })
      .promise()
    console.log(` --> Uploaded to ${urlUpload}`)
    console.log(` --> Uploaded to ${urlUpload}`)
    console.log(' ----> yay done', buffer)
  }

  const mediaAttributes = await getMediaAttributes(buffer, ext)
  console.log('got mediaAttributes', mediaAttributes)

  return {
    uri: urlUpload,
    mediaAttributes,
  }
}

export const getSignedDownloadUrl = (
  server: FastifyInstance,
  assetUrl: string,
) => {
  // @todo: got assets floating on multiple buckets, thus this ugly solution of dissecting the url
  // @todo: swap this back to use config/ENV values whenever we're living on a single bucket
  // const currentBucketUrl = s3Url(server, '')
  // const isLegacyBucket = !assetUrl.includes(currentBucketUrl)
  const fileBucketUrlParts = assetUrl.split('/')
  const bucketName = fileBucketUrlParts[2].split('.')[0]
  const assetPath = fileBucketUrlParts[fileBucketUrlParts.length - 1]

  const params = {
    // Bucket: server.config.AWS_S3_BUCKET || '',
    Bucket: bucketName,
    Key: assetPath,
  }

  return new Promise(function (resolve, reject) {
    server.s3
      .headObject(params)
      .promise()
      .then(function () {
        // console.log('s3 File exists')
        resolve(
          createSignedDownloadUrl(server, {
            ...params,
            ResponseContentType: 'application/octet-stream',
            Expires: 60 * 5, // URL will be valid for 5 minutes
          }),
        )
      })
      .catch(function (err) {
        console.log('Generating Url Failed', err)
        reject('Generating Url Failed: file does not exist')
      })
  })
}

export const createSignedDownloadUrl = (
  server: FastifyInstance,
  params: {
    Bucket: string
    Key: string
    ResponseContentType: string
    Expires: number
  },
) => {
  return server.s3.getSignedUrl('getObject', params)
}

export const s3Url = (server: FastifyInstance, filename: string) =>
  `https://${server.config.AWS_S3_BUCKET}.s3.${server.config.AWS_REGION}.amazonaws.com/${filename}`

export const registerS3 = async (fastify: FastifyInstance) => {
  try {
    const s3 = new AWS.S3({
      accessKeyId: fastify.config.AWS_ACCESS_KEY,
      secretAccessKey: fastify.config.AWS_SECRET_KEY,
      region: fastify.config.AWS_REGION,
    })
    fastify.decorate('s3', s3)
    fastify.decorate('uploadUrlAsset', uploadUrlAsset)
    fastify.decorate('uploadThumbnailAsset', uploadThumbnailAsset)
    fastify.decorate('uploadBufferAsset', uploadBufferAsset)
    fastify.decorate('getSignedDownloadUrl', getSignedDownloadUrl)
    fastify.log.info('Successfully registered S3Plugin')
  } catch (err) {
    fastify.log.error('Plugin: S3, error on register', err)
    console.error(err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    s3: AWS.S3
    uploadUrlAsset: (
      server: FastifyInstance,
      url: string,
      fileExtension?: string | null,
    ) => Promise<Asset>
    uploadThumbnailAsset: (
      server: FastifyInstance,
      assetInput: string | Buffer,
    ) => Promise<string>
    uploadBufferAsset: (
      server: FastifyInstance,
      buffer: Buffer,
      fileExtension?: string | null,
    ) => Promise<{ uri: string; mediaAttributes: MediaAttributes }>
    getSignedDownloadUrl: (
      server: FastifyInstance,
      assetUrl: string,
    ) => Promise<string>
  }
}

export default registerS3
