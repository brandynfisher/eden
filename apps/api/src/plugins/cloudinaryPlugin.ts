import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
import type { FastifyInstance } from 'fastify'
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
  mediaType: MediaType,
): Promise<MediaAttributes> => {
  const mediaAttributes: MediaAttributes = {
    type: mediaType,
  }

  console.log({uploadResponse})

  // @todo: verify that this actually works. Documentation and code looks rather wonky
  if (mediaType === MediaType.Video || mediaType === MediaType.Audio) {
    mediaAttributes.duration = uploadResponse.duration
  }

  if (mediaType === MediaType.Image || mediaType === MediaType.Video) {
    mediaAttributes.width = uploadResponse.width
    mediaAttributes.height = uploadResponse.height
    mediaAttributes.aspectRatio = uploadResponse.width / uploadResponse.height
  }

  return mediaAttributes
}

export const uploadCldBufferAsset = async (
  server: FastifyInstance,
  mediaType: MediaType,
  buffer: Buffer,
): Promise<Asset> => {
  console.log('uploadCldBufferAsset', mediaType, MediaType.Image, server.cloudinary.config())
  const optionalConfig = mediaType === MediaType.Video || mediaType === MediaType.Audio ? { media_metadata: true } : {}
  console.log({optionalConfig})

  try {
    const uploadResult = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {

      //@todo: large files (min. 5MB) should be uploaded in chunks. will need to implement
      // if (mediaType === MediaType.Image) {
      console.log('upload_stream')
      server.cloudinary.uploader.upload_stream({ folder: 'creations' }, (error, uploadResponse) => {
        if (error) {
          console.log('upload_stream error', error)
          return reject()
        }

        console.log(uploadResponse)
        return resolve(uploadResponse)
      }).end(buffer)
      // } else {
      //   console.log('upload_chunked_stream')
      //
      //   server.cloudinary.uploader.upload_chunked_stream(
      //     {
      //       chunk_size: 10,
      //       resource_type: 'auto',
      //       folder: 'creations',
      //       ...optionalConfig,
      //     },
      //     (error, uploadResponse) => {
      //       if (error) {
      //         console.log('upload_chunked_stream error', error)
      //         return reject()
      //       }
      //
      //       console.log({uploadResponse})
      //       return resolve(uploadResponse)
      //     }
      //   ).end(buffer)
      // }
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

    const mediaAttributes = await getMediaAttributes(uploadResult, mediaType)

    // If video: get thumbnail url for free by changing file ending
    const thumbnailUri = mediaType == MediaType.Video ? `${uploadResult.secure_url.substring(0, uploadResult.secure_url.lastIndexOf('.'))}.webp` : uploadResult.secure_url

    return {
      uri: uploadResult.secure_url,
      thumbnailUri,
      mediaAttributes,
    }
  } catch (e) {
    console.error('uploadCldBufferAsset failed returning dummy')
    return {
      uri: '',
      thumbnailUri: '',
      mediaAttributes: {
        type: mediaType,
      },
    }
  }
}


type UploadConfig = {
  eager?: string,
  folder?: string,
}

const signRequest = (server: FastifyInstance, uploadConfig: UploadConfig) => {
  if (!server.config.CLOUDINARY_API_SECRET) {
    console.log('CLOUDINARY_API_SECRET not set')
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
