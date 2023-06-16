import { MediaAttributes, MediaType } from '@eden-labs/eden-sdk'
import axios from 'axios'
import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { Client as MinioClient } from 'minio'
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
  const client = server.minio as MinioClient
  const MINIO_BUCKET = server.config.MINIO_BUCKET
  const sha = util.sha256(buffer)
  const fileType = await fileTypeFromBuffer(buffer)
  const { ext, mime } = fileType
    ? (fileType as { ext: string; mime: string })
    : { ext: 'txt', mime: 'text/plain' }
  const metadata = { 'Content-Type': mime, SHA: sha }
  const filename = `${sha}.${fileExtension || ext}`
  const urlUpload = minioUrl(server, filename)
  try {
    await client.statObject(MINIO_BUCKET, filename)
    console.log(
      ` --> Object ${filename} already exists in ${MINIO_BUCKET}, skipping upload`,
    )
  } catch (error) {
    await client.putObject(MINIO_BUCKET, filename, buffer, metadata)
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

export const minioUrl = (server: FastifyInstance, filename: string) =>
  `${server.config.MINIO_URI}/${filename}`

export const registerMinio = async (fastify: FastifyInstance) => {
  try {
    let minio
    if (fastify.config.MINIO_PORT) {
      minio = new MinioClient({
        endPoint: fastify.config.MINIO_HOST,
        port: parseInt(fastify.config.MINIO_PORT),
        useSSL: false,
        accessKey: fastify.config.MINIO_ACCESS_KEY,
        secretKey: fastify.config.MINIO_SECRET_KEY,
      })
    } else {
      minio = new MinioClient({
        endPoint: fastify.config.MINIO_HOST,
        accessKey: fastify.config.MINIO_ACCESS_KEY,
        secretKey: fastify.config.MINIO_SECRET_KEY,
      })
    }
    fastify.decorate('minio', minio)
    fastify.decorate('uploadUrlAsset', uploadUrlAsset)
    fastify.decorate('uploadThumbnailAsset', uploadThumbnailAsset)
    fastify.log.info('Successfully registered MinioPlugin')
  } catch (err) {
    fastify.log.error('Plugin: Minio, error on register', err)
    console.error(err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    minio: MinioClient
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

export default registerMinio
