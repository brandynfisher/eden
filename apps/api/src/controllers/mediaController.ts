import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { uploadBufferAsset } from '../plugins/minioPlugin'

export const uploadMedia = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const data = await request.file()

  if (data && data.mimetype.startsWith('image/')) {
    const buffer = await data.toBuffer()

    const url = await uploadBufferAsset(server, buffer)
    return reply.status(200).send({ url })
  } else {
    return reply.status(400).send({
      message: 'Invalid file type. Only images are allowed',
    })
  }

  return reply.status(500).send({
    message: 'No data found in upload',
  })
}
