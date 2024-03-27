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

  const { uri } = await server.uploadBufferAsset(server, buffer)
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
  const { uri } = await server.uploadBufferAsset(server, buffer)
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

  const signedUrl = await server.getSignedDownloadUrl(server, url, fileName)

  return reply.status(200).send({ signedUrl })
}

export const uploadMediaRequest = async (
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
    const signedUrl = await server.generateUploadSignedUrl(server, {
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
