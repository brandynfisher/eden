import { ChromaClient } from 'chromadb'
import type { FastifyInstance } from 'fastify'

export const registerChroma = async (
  fastify: FastifyInstance,
  chromaUri: string | undefined,
) => {
  const uri = chromaUri || fastify.config.CHROMA_URI
  console.log('CONNECT TO URI 1', uri)
  try {
    console.log('CONNECT TO URI', uri)
    const chromadb = new ChromaClient({
      path: uri,
      auth: { provider: 'basic', credentials: 'chromadb:changeme' },
    })
    console.log('CONNECT TO URI 3')
    console.log(chromadb)
    fastify.decorate('chromadb', chromadb)
    fastify.log.info('Successfully registered ChromaPlugin')
  } catch (err) {
    fastify.log.error('Plugin: Chroma, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    chromadb?: ChromaClient
  }
}

export default registerChroma
