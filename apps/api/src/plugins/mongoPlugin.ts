import type { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'

export const registerMongo = async (
  fastify: FastifyInstance,
  mongoUri: string | undefined,
) => {
  const url = mongoUri || fastify.config.MONGO_URI
  try {
    // Removed the @fastify/mongodb registration: `server.mongo` was never used
    // (all queries + change streams go through mongoose), so it opened a second
    // idle Atlas connection pool for nothing. Also cap mongoose pool (was default 100).
    mongoose.set('strictQuery', true)
    await mongoose.connect(url as string, { maxPoolSize: 10 })

    fastify.decorate('mongoose', mongoose)

    fastify.log.info('Successfully registered plugin: Mongo')
  } catch (err) {
    fastify.log.error({ err }, 'Plugin: Mongo, error on register')
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    mongoose: typeof mongoose
  }
}

export default registerMongo
