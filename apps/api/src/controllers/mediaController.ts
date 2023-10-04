import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { fileTypeFromBuffer } from 'file-type'

import { Upload } from '../models/Upload'

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

  // Allow images, audio, text, and .bin files
  if (
    !type ||
    !(
      type.mime.startsWith('image/') ||
      type.mime.startsWith('audio/') ||
      type.mime.startsWith('text/') ||
      type.mime.startsWith('application/zip')
    )
  ) {
    return reply.status(400).send({
      message: 'Invalid file type',
    })
  }

  const { uri, mediaAttributes } = await server.uploadBufferAsset(
    server,
    buffer,
  )

  let upload = await Upload.findOne({ uri })
  if (!upload) {
    upload = new Upload({
      user: request.user.userId,
      uri,
      mediaAttributes,
    })
    await upload.save()
  }

  return reply.status(200).send({
    uploadId: upload._id,
    url: uri,
  })
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
