import crypto from 'crypto'
import { FastifyInstance } from 'fastify'

export const sha256 = (data: crypto.BinaryLike) => {
  const hashSum = crypto.createHash('sha256')
  hashSum.update(data)
  return hashSum.digest('hex')
}

export const randomId = (length: number) => {
  const rand = crypto.randomBytes(length)
  const uniqueId = rand.toString('hex')
  return uniqueId
}

export const getAdminHeaders = (server: FastifyInstance) => {
  return {
    'X-Api-Key': server.config.EDEN_ADMIN_API_KEY,
    'X-Api-Secret': server.config.EDEN_ADMIN_API_SECRET,
  }
}
