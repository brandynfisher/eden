import { createTestServer } from '../util'
import { FastifyInstance } from 'fastify'
import { afterEach, beforeEach } from 'vitest'

beforeEach(async context => {
  const server = await createTestServer()
  context.server = server
})

afterEach(async context => {
  const server = context.server as FastifyInstance | undefined
  if (server) {
    await server.close()
    context.server = undefined
  }
})
