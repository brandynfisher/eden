import { UploadsGetArguments, UploadsListArguments } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

import { User } from '../models/Creator'
import { Upload, UploadDocument } from '../models/Upload'
import CreatorRepository from '../repositories/CreatorRepository'
import UploadRepository from '../repositories/UploadRepository'

export const listUploads = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort } = request.query as UploadsListArguments
  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId,
  })

  const uploadRepository = new UploadRepository(Upload)
  const uploads = await uploadRepository.query(
    {
      user: creators.docs
        ? creators.docs.map(creator => creator._id)
        : undefined,
    },
    {
      limit,
      page,
      sort,
    },
  )

  return reply.status(200).send(uploads)
}

export const getUpload = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { uploadId } = request.params as UploadsGetArguments

  const upload = (await Upload.findById(uploadId)) as UploadDocument

  if (!upload) {
    return reply.status(404).send({
      message: 'Upload not found',
    })
  }

  return await reply.status(200).send({ upload })
}
