import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
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
  const client = server.minio as MinioClient
  const MINIO_BUCKET = server.config.MINIO_BUCKET as string
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
  const urlUpload = minioUrl(server, filename)
  console.log('upload to ', urlUpload)
  try {
    await client.statObject(MINIO_BUCKET, filename)
    console.log(
      ` --> Object ${filename} already exists in ${MINIO_BUCKET}, skipping upload`,
    )
  } catch (error) {
    console.log(' ---> uploading buffer ', filename, metadata, buffer)
    await client.putObject(MINIO_BUCKET, filename, buffer, metadata)
    console.log(` --> Uploaded to ${urlUpload}`)
    console.log(' ----> yay done', buffer)
  }
  const mediaAttributes = await getMediaAttributes(buffer, ext)

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
        endPoint: fastify.config.MINIO_HOST as string,
        port: parseInt(fastify.config.MINIO_PORT),
        useSSL: false,
        accessKey: fastify.config.MINIO_ACCESS_KEY as string,
        secretKey: fastify.config.MINIO_SECRET_KEY as string,
      })
    } else {
      minio = new MinioClient({
        endPoint: fastify.config.MINIO_HOST as string,
        accessKey: fastify.config.MINIO_ACCESS_KEY as string,
        secretKey: fastify.config.MINIO_SECRET_KEY as string,
      })
    }
    fastify.decorate('minio', minio)
    fastify.decorate('uploadUrlAsset', uploadUrlAsset)
    fastify.decorate('uploadThumbnailAsset', uploadThumbnailAsset)
    fastify.decorate('uploadBufferAsset', uploadBufferAsset)
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
    uploadBufferAsset: (
      server: FastifyInstance,
      buffer: Buffer,
      fileExtension?: string | null,
    ) => Promise<{ uri: string; mediaAttributes: MediaAttributes }>
  }
}

export default registerMinio
