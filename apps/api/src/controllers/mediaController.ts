import { Creation } from '../models/Creation'
import { s3BaseUrl } from '../plugins/s3Plugin'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { fileTypeFromBuffer } from 'file-type'

export const uploadMedia = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const data = await request.file()

  if (!data) {
    return reply.status(500).send({
      message: 'No data found in upload',
    })
  }

  const buffer = await data.toBuffer()
  const type = await fileTypeFromBuffer(buffer)

  // Allow images, video, audio, text, and .bin files
  if (
    !type ||
    !(
      type.mime.startsWith('image/') ||
      type.mime.startsWith('video/') ||
      type.mime.startsWith('audio/') ||
      type.mime.startsWith('text/') ||
      type.mime.startsWith('application/zip')
    )
  ) {
    return reply.status(400).send({
      message: 'Invalid file type',
    })
  }

  const { uri } = await server.uploadS3BufferAsset(server, buffer, type)
  return reply.status(200).send({ url: uri })
}

export const uploadMediaAdmin = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const data = await request.file()

  if (!data) {
    return reply.status(500).send({
      message: 'No data found in upload',
    })
  }

  const buffer = await data.toBuffer()
  const type = await fileTypeFromBuffer(buffer)

  // Allow images, video, audio, text, and .bin files
  if (
    !type ||
    !(
      type.mime.startsWith('image/') ||
      type.mime.startsWith('video/') ||
      type.mime.startsWith('audio/') ||
      type.mime.startsWith('text/') ||
      type.mime.startsWith('application/zip')
    )
  ) {
    return reply.status(400).send({
      message: 'Invalid file type',
    })
  }

  const { uri } = await server.uploadS3BufferAsset(server, buffer, type)
  return reply.status(200).send({ url: uri })
}

export const getMediaDownloadUrl = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { url, fileName } = request.query as { url: string; fileName: string }

  if (!url) {
    return reply.status(500).send({
      message: 'No url provided',
    })
  }

  const signedUrl = await server.getS3SignedDownloadUrl(server, url, fileName)

  return reply.status(200).send({ signedUrl })
}

export const uploadS3MediaRequest = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { filename, contentType } = request.body as {
    filename: string
    contentType: string
  }

  if (!filename || !contentType) {
    return reply.status(400).send({
      message: 'Missing fileName or contentType',
    })
  }

  try {
    const signedUrl = await server.generateS3UploadSignedUrl(server, {
      filename,
      contentType,
    })
    return reply.status(200).send({ signedUrl })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return reply.status(500).send({
      message: 'Error generating signed URL',
    })
  }
}

export const uploadMediaRequestCloudinary = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const signature = server.generateCldUploadSignature(server)
    return reply.status(200).send(signature)
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return reply.status(500).send({
      message: 'Error generating signed URL',
    })
  }
}

export const receiveMediaTranscodeUpdate = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { secret } = request.query as { secret: string }
  const { s3key } = request.body as {
    s3key: string
  }

  if (secret !== server.config.WEBHOOK_SECRET) {
    return reply.status(401).send({
      message: 'Invalid webhook secret',
    })
  }

  // const baseUrl = s3BaseUrl(server)
  const baseUrl = s3BaseUrl(server)
  const creationUri = `${baseUrl}/${s3key}`
  const parts = s3key.split('/')
  const ogFileName = parts.pop() || '' // Provide a fallback empty string if pop() returns undefined
  const ogFile = ogFileName.replace(/\.[^/.]+$/, '') // Remove the extension
  const filename = `${ogFile}.m3u8`
  const mediaUri = `${baseUrl}/transcoded/${s3key}/${filename}`
  console.log('creationUri', creationUri)
  console.log('mediaUri', mediaUri)

  const creation = await Creation.findOne({ uri: creationUri })

  if (!creation) {
    return reply.status(404).send({
      message: 'Creation not found',
    })
  }

  creation.mediaUri = mediaUri
  await creation.save()

  return reply.status(200).send({})
}
