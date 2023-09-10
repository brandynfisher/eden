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
}

const getMediaDuration = async (buffer: Buffer): Promise<number> => {
  const tempFilePath = join(tmpdir(), randomUUID())
  await fs.writeFileSync(tempFilePath, buffer)
  const duration = await new Promise<number | undefined>((resolve, reject) => {
    ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
      if (err) reject(err)
      else resolve(metadata.format.duration)
    })
  })
  if (!duration) throw new Error('Could not get media duration')
  return duration
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
  const client = server.s3
  const S3_BUCKET = server.config.AWS_S3_BUCKET
  const sha = util.sha256(buffer)
  const fileType = await fileTypeFromBuffer(buffer)
  const { ext, mime } = fileType
    ? (fileType as { ext: string; mime: string })
    : { ext: 'txt', mime: 'text/plain' }
  const metadata = { 'Content-Type': mime, SHA: sha }
  const filename = `${sha}.${fileExtension || ext}`
  const urlUpload = s3Url(server, filename)
  try {
    await client.headObject({ Bucket: S3_BUCKET, Key: filename }).promise()
    console.log(
      ` --> Object ${filename} already exists in ${S3_BUCKET}, skipping upload`,
    )
  } catch (error) {
    await client
      .putObject({
        Bucket: S3_BUCKET,
        Key: filename,
        Body: buffer,
        Metadata: metadata,
      })
      .promise()
    console.log(` --> Uploaded to ${urlUpload}`)
  }

  const mediaType = mediaTypeMap[ext]

  const mediaAttributes: MediaAttributes = {
    type: mediaType,
  }

  if (mediaType === MediaType.Video || mediaType === MediaType.Audio) {
    const duration = await getMediaDuration(buffer)
    mediaAttributes.duration = duration
  }

  return {
    uri: urlUpload,
    mediaAttributes,
  }
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
    fastify.log.info('Successfully registered MinioPlugin')
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
  }
}

export default registerS3
