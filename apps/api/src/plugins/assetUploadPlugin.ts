import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
import type { FastifyInstance } from 'fastify'
import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'

export interface Asset {
  uri: string
  thumbnailUri?: string
  assetBuffer?: Buffer
  mediaAttributes: MediaAttributes
}

export const mediaTypeMap: Record<string, MediaType> = {
  mp4: MediaType.Video,
  m3u8: MediaType.Video,
  jpg: MediaType.Image,
  jpeg: MediaType.Image,
  png: MediaType.Image,
  webp: MediaType.Image,
  zip: MediaType.Zip,
}

const uploadUrlAsset = async (
  server: FastifyInstance,
  url: string,
) => {
  const asset = await axios.get(url, { responseType: 'arraybuffer' })
  const assetB64 = Buffer.from(asset.data, 'base64')

  const fileType = await fileTypeFromBuffer(assetB64)

  if (!fileType) {
    throw new Error('fileType from buffer is undefined')
  }

  const mediaType = mediaTypeMap[fileType?.ext || 'txt']

  return server.uploadCldBufferAsset(server, mediaType, assetB64)
}

export const registerAssetUpload = async (fastify: FastifyInstance) => {
  try {
    fastify.decorate('uploadUrlAsset', uploadUrlAsset)
    fastify.log.info('Successfully registered Asset Upload Plugin')
  } catch (err) {
    fastify.log.error('Plugin: Asset Upload, error on register', err)
    console.error(err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    uploadUrlAsset: (
      server: FastifyInstance,
      url: string,
    ) => Promise<Asset>
  }
}

export default registerAssetUpload