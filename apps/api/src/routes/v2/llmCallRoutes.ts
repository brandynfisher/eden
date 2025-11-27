import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

const llmCallRoutes: FastifyPluginAsync = async server => {
  server.get('/v2/llm-calls/:id', {
    schema: {
      tags: ['LLM Calls'],
      summary: 'Get LLM Call Data',
      description: 'Retrieve raw LLM call data by ID',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        id: Type.String(),
      }),
      // No response schema - allow raw MongoDB document to pass through
    },
    handler: async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params

      try {
        // Access the llm_calls collection directly
        const db = mongoose.connection.db
        if (!db) {
          console.log('[LLM Call] Database not connected')
          return reply.status(500).send({ error: 'Database not connected' })
        }

        console.log('[LLM Call] Looking up ID:', id)

        // List all collections to debug
        const collections = await db.listCollections().toArray()
        const collectionNames = collections.map(c => c.name)
        console.log('[LLM Call] Available collections:', collectionNames)

        // Try to find the llm_calls collection (try different naming conventions)
        const possibleNames = ['llm_calls', 'llmcalls', 'LlmCalls', 'llmCalls']
        let collectionName = 'llm_calls'
        for (const name of possibleNames) {
          if (collectionNames.includes(name)) {
            collectionName = name
            break
          }
        }
        console.log('[LLM Call] Using collection:', collectionName)

        const collection = db.collection(collectionName)

        // Try to find by ObjectId
        let llmCall = null
        try {
          llmCall = await collection.findOne({ _id: new ObjectId(id) })
        } catch (e) {
          console.log('[LLM Call] ObjectId lookup failed, trying string ID')
          // Try string ID if ObjectId fails
          llmCall = await collection.findOne({ _id: id })
        }

        console.log('[LLM Call] Found document:', llmCall ? 'yes' : 'no')
        if (llmCall) {
          console.log('[LLM Call] Document keys:', Object.keys(llmCall))
        } else {
          // List sample documents to debug
          const sample = await collection.findOne({})
          console.log(
            '[LLM Call] Sample document in collection:',
            sample ? Object.keys(sample) : 'none',
          )
        }

        if (!llmCall) {
          return reply
            .status(404)
            .send({ error: 'LLM call not found', id, collectionName })
        }

        return reply.status(200).send(llmCall)
      } catch (error) {
        console.error('[LLM Call] Error:', error)
        server.log.error({
          message: 'Failed to get LLM call',
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        return reply.status(500).send({
          error: 'Failed to fetch LLM call data',
        })
      }
    },
  })
}

export default llmCallRoutes
