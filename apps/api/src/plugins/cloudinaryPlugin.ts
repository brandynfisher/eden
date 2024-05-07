import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary'
import { Asset } from './assetUploadPlugin'

export interface CloudinaryUploadSignature {
  signature: string,
  timestamp: number,
  cloudName: string | undefined,
  apiKey: string | undefined
}

const getMediaAttributes = async (
  uploadResponse: UploadApiResponse,
  buffer: Buffer,
  mediaType: MediaType,
): Promise<MediaAttributes> => {
  const tempFilePath = join(tmpdir(), randomUUID())
  fs.writeFileSync(tempFilePath, buffer)

  const mediaAttributes: MediaAttributes = {
    type: mediaType,
  }

  // @todo: once we upload videos to cloudinary, this can probably be changed as they'll deliver this to us after upload

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
    mediaAttributes.width = uploadResponse.width
    mediaAttributes.height = uploadResponse.height
    mediaAttributes.aspectRatio = uploadResponse.width / uploadResponse.height
  }

  fs.unlinkSync(tempFilePath)

  return mediaAttributes
}

export const uploadCldBufferAsset = async (
  server: FastifyInstance,
  mediaType: MediaType,
  buffer: Buffer,
): Promise<Asset> => {
  const uploadResult = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {
    if (mediaType === MediaType.Image) {
      server.cloudinary.uploader.upload_stream((error, uploadResponse) => {
        if (error) {
          console.error('upload_stream error', error)
          return reject()
        }

        return resolve(uploadResponse)
      }).end(buffer)
    } else {
      server.cloudinary.uploader.upload_chunked_stream({ chunk_size: 10, resource_type: 'auto' },(error, uploadResponse) => {
        if (error) {
          console.error('upload_chunked_stream error', error)
          return reject()
        }

        return resolve(uploadResponse)
      }).end(buffer)
    }
  })

  if (!uploadResult) {
    console.log('upload failed')
    return {
      uri: '',
      thumbnailUri: '',
      mediaAttributes: {
        type: mediaType,
      },
    }
  }

  const mediaAttributes = await getMediaAttributes(uploadResult, buffer, mediaType)

  // If video: get thumbnail url for free by changing file ending
  const thumbnailUri = mediaType == MediaType.Video ? `${uploadResult.secure_url.substring(0, uploadResult.secure_url.lastIndexOf('.'))}.webp` : uploadResult.secure_url

  return {
    uri: uploadResult.secure_url,
    thumbnailUri,
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

  const timestamp = Math.round((new Date).getTime() / 1000)

  const signature = server.cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      ...uploadConfig,
    },
    server.config.CLOUDINARY_API_SECRET,
  )

  return { timestamp, signature }
}

export const generateCldUploadSignature: (server: FastifyInstance) => CloudinaryUploadSignature = (
  server: FastifyInstance,
) => {
  const uploadConfig = {
    // eager: 'c_pad,h_300,w_400|c_crop,h_200,w_260', //@todo: set this to something useful
    folder: 'user_uploads', // @todo: configure actual folder
  }
  const sig = signRequest(server, uploadConfig)

  return {
    signature: sig.signature,
    timestamp: sig.timestamp,
    cloudName: server.config.CLOUDINARY_CLOUD_NAME,
    apiKey: server.config.CLOUDINARY_API_KEY,
  }
}
// export const getSignedDownloadUrl = (
//   server: FastifyInstance,
//   assetUrl: string,
//   fileName?: string,
// ): Promise<string> => {
//   // @todo: got assets floating on multiple buckets, thus this ugly solution of dissecting the url
//   // @todo: swap this back to use config/ENV values whenever we're living on a single bucket
//   //  currentBucketUrl = s3Url(server, '')
//   // const isLegacyBucket = !assetUrl.includes(currentBucketUrl)
//   const fileBucketUrlParts = assetUrl.split('/')
//   const bucketName = server.config.AWS_S3_BUCKET
//
//   if (!bucketName) {
//     throw new Error('No bucket name found')
//   }
//
//   const assetPath = fileBucketUrlParts[fileBucketUrlParts.length - 1]
//
//   const params = {
//     // Bucket: server.config.AWS_S3_BUCKET || '',
//     Bucket: bucketName,
//     Key: assetPath,
//   }
//
//   return new Promise(function(resolve, reject) {
//     server.s3
//       .headObject(params)
//       .promise()
//       .then(function() {
//         // console.log('s3 File exists', {
//         //   ...params,
//         //   ResponseContentType: 'application/octet-stream',
//         //   ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : undefined,
//         //   Expires: 60 * 60 * 72, // 3 days
//         // })
//         // if (fileName) {
//         //   console.log('client requested custom filename. add dispo header', { ResponseContentDisposition: 'attachment; filename="' + fileName + '"' })
//         // }
//
//         resolve(
//           createSignedDownloadUrl(server, {
//             ...params,
//             ResponseContentType: 'application/octet-stream',
//             ResponseContentDisposition: fileName
//               ? `attachment; filename="${fileName}"`
//               : undefined,
//             Expires: 60 * 60 * 72, // 3 days
//           }),
//         )
//       })
//       .catch(function(err) {
//         console.log('Generating Url Failed', err)
//         reject('Generating Url Failed: file does not exist')
//       })
//   })
// }
//
// export const createSignedDownloadUrl = (
//   server: FastifyInstance,
//   params: {
//     Bucket: string
//     ResponseContentType: string
//     ResponseContentDisposition: string | undefined
//     Expires: number
//     Key: string
//   },
// ) => {
//   return server.s3.getSignedUrl('getObject', params)
// }

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
    fastify.decorate('uploadCldBufferAsset', uploadCldBufferAsset)
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
    uploadCldBufferAsset: (
      server: FastifyInstance,
      mediaType: MediaType,
      buffer: Buffer,
    ) => Promise<Asset>
    uploadCldThumbnailAsset: (
      server: FastifyInstance,
      assetInput: string | Buffer,
    ) => Promise<string>
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
