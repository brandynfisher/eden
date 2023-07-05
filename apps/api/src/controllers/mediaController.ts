import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { fileTypeFromBuffer } from 'file-type'

import { uploadBufferAsset } from '../plugins/minioPlugin'

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

  // Allow only images
  if (!type || !type.mime.startsWith('image/')) {
    return reply.status(400).send({
      message: 'Invalid file type. Only images are allowed',
    })
  }

  const { uri } = await uploadBufferAsset(server, buffer)
  return reply.status(200).send({ url: uri })
}
