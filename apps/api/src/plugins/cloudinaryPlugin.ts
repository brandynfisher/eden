import * as util from '../lib/util'
import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'

export interface CloudinaryUploadSignature {
  signature:string,
  timestamp: number,
  cloudName: string|undefined,
  apiKey: string|undefined
}

export interface Asset {
  uri: string
  assetBuffer: Buffer
  mediaAttributes: MediaAttributes
}

const mediaTypeMap: Record<string, MediaType> = {
  mp4: MediaType.Video,
  m3u8: MediaType.Video,
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
  const client = server.s3
  const S3_BUCKET = server.config.AWS_S3_BUCKET as string
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
  } catch (error) {
    await client
      .putObject({
        Bucket: S3_BUCKET,
        Key: filename,
        Body: buffer,
        Metadata: metadata,
        ContentType: mime,
      })
      .promise()
  }

  const mediaAttributes = await getMediaAttributes(buffer, ext)

  return {
    uri: urlUpload,
    mediaAttributes,
  }
}


type UploadConfig = {
  eager?: string,
  folder?: string,
}

const signRequest = (server: FastifyInstance, uploadConfig: UploadConfig) => {
  if (!server.config.CLOUDINARY_API_SECRET) {
    throw new Error('CLOUDINARY_API_SECRET not set')
  }

  const timestamp = Math.round((new Date).getTime()/1000);

  const signature = server.cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      ...uploadConfig,
    },
    server.config.CLOUDINARY_API_SECRET
  );

  return { timestamp, signature }
}

export const generateCldUploadSignature: (server: FastifyInstance) => CloudinaryUploadSignature = (
  server: FastifyInstance,
) => {
  const uploadConfig = {
    // eager: 'c_pad,h_300,w_400|c_crop,h_200,w_260', //@todo: set this to something useful
    folder: 'signed_upload_demo_form' // @todo: configure actual folder
  }
  const sig = signRequest(server, uploadConfig)

  return {
    signature: sig.signature,
    timestamp: sig.timestamp,
    cloudName: server.config.CLOUDINARY_CLOUD_NAME,
    apiKey: server.config.CLOUDINARY_API_KEY
  }
}
export const getSignedDownloadUrl = (
  server: FastifyInstance,
  assetUrl: string,
  fileName?: string,
): Promise<string> => {
  // @todo: got assets floating on multiple buckets, thus this ugly solution of dissecting the url
  // @todo: swap this back to use config/ENV values whenever we're living on a single bucket
  //  currentBucketUrl = s3Url(server, '')
  // const isLegacyBucket = !assetUrl.includes(currentBucketUrl)
  const fileBucketUrlParts = assetUrl.split('/')
  const bucketName = server.config.AWS_S3_BUCKET

  if (!bucketName) {
    throw new Error('No bucket name found')
  }

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
        // console.log('s3 File exists', {
        //   ...params,
        //   ResponseContentType: 'application/octet-stream',
        //   ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : undefined,
        //   Expires: 60 * 60 * 72, // 3 days
        // })
        // if (fileName) {
        //   console.log('client requested custom filename. add dispo header', { ResponseContentDisposition: 'attachment; filename="' + fileName + '"' })
        // }

        resolve(
          createSignedDownloadUrl(server, {
            ...params,
            ResponseContentType: 'application/octet-stream',
            ResponseContentDisposition: fileName
              ? `attachment; filename="${fileName}"`
              : undefined,
            Expires: 60 * 60 * 72, // 3 days
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
    ResponseContentType: string
    ResponseContentDisposition: string | undefined
    Expires: number
    Key: string
  },
) => {
  return server.s3.getSignedUrl('getObject', params)
}

export const s3BaseUrl = (server: FastifyInstance) => {
  if (server.config.AWS_CLOUDFRONT_URL) {
    // Check if AWS_CLOUDFRONT_URL already includes https://
    return server.config.AWS_CLOUDFRONT_URL.startsWith('https://')
      ? server.config.AWS_CLOUDFRONT_URL
      : `https://${server.config.AWS_CLOUDFRONT_URL}`
  } else {
    return `https://${server.config.AWS_S3_BUCKET}.s3.${server.config.AWS_REGION}.amazonaws.com`
  }
}

export const rawS3BaseUrl = (server: FastifyInstance) => {
  return `https://${server.config.AWS_S3_BUCKET}.s3.${server.config.AWS_REGION}.amazonaws.com`
}

export const s3Url = (server: FastifyInstance, filename: string) => {
  const baseUrl = s3BaseUrl(server)
  return `${baseUrl}/${filename}`
}

export const registerCloudinary = async (fastify: FastifyInstance) => {
  try {
    cloudinary.config({
      api_secret: fastify.config.CLOUDINARY_API_SECRET,
      api_key: fastify.config.CLOUDINARY_API_KEY,
      cloud_name: fastify.config.CLOUDINARY_CLOUD_NAME,
    })

    fastify.decorate('cloudinary', cloudinary)
    // fastify.decorate('uploadCldUrlAsset', uploadCldUrlAsset)
    // fastify.decorate('uploadCldThumbnailAsset', uploadCldThumbnailAsset)
    // fastify.decorate('uploadCldBufferAsset', uploadCldBufferAsset)
    // fastify.decorate('getCldSignedDownloadUrl', getSignedCldDownloadUrl)
    fastify.decorate('generateCldUploadSignature', generateCldUploadSignature)
    fastify.log.info('Successfully registered CloudinaryPlugin')
  } catch (err) {
    fastify.log.error('Plugin: Cloudinary, error on register', err)
    console.error(err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    cloudinary: typeof cloudinary
    uploadCldUrlAsset: (
      server: FastifyInstance,
      url: string,
      fileExtension?: string | null,
    ) => Promise<Asset>
    uploadCldThumbnailAsset: (
      server: FastifyInstance,
      assetInput: string | Buffer,
    ) => Promise<string>
    uploadCldBufferAsset: (
      server: FastifyInstance,
      buffer: Buffer,
      fileExtension?: string | null,
    ) => Promise<{ uri: string; mediaAttributes: MediaAttributes }>
    getCldSignedDownloadUrl: (
      server: FastifyInstance,
      assetUrl: string,
      fileName?: string,
    ) => Promise<string>
    generateCldUploadSignature: (
      server: FastifyInstance,
    ) => CloudinaryUploadSignature
  }
}

export default registerCloudinary
