import { Assistant, Interaction } from '@edenlabs/eden-sdk'
import axios from 'axios'
import type { FastifyInstance } from 'fastify'

import { LogosResponse } from './tasks'

const handleInteraction = async (
  server: FastifyInstance,
  assistant: Assistant,
  interaction: Interaction,
): Promise<LogosResponse> => {
  const { data } = await axios.post(`${server.config.LOGOS_URL}/interact`, {
    assistant,
    interaction,
  })
  return data
}

export const registerLogos = async (fastify: FastifyInstance) => {
  try {
    fastify.decorate('handleInteraction', handleInteraction)
    fastify.log.info('Successfully registered playHtPlugin')
  } catch (err) {
    console.log(err)
    fastify.log.error('Plugin: Logos, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    handleInteraction: (
      server: FastifyInstance,
      assistant: Assistant,
      interaction: Interaction,
    ) => Promise<LogosResponse>
  }
}

export default registerLogos
