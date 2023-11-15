import type { FastifyInstance } from 'fastify'
import { OpenAI } from 'openai'

export const registerOpenai = async (fastify: FastifyInstance) => {
  try {
    const openai = new OpenAI({
      apiKey: fastify.config.OPENAI_API_KEY,
    })
    fastify.decorate('openai', openai)
    fastify.log.info('Successfully registered OpenaiPlugin')
  } catch (err) {
    console.error(err)
    fastify.log.error('Plugin: Openai, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    openai: OpenAI
  }
}

export default registerOpenai
