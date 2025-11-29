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
        const db = mongoose.connection.db
        if (!db) {
          return reply.status(500).send({ error: 'Database not connected' })
        }

        const collection = db.collection('llm_calls')

        // Try to find by ObjectId
        let llmCall = null
        try {
          llmCall = await collection.findOne({ _id: new ObjectId(id) })
        } catch {
          // Try string ID if ObjectId fails
          llmCall = await collection.findOne({ _id: id })
        }

        if (!llmCall) {
          return reply.status(404).send({ error: 'LLM call not found' })
        }

        return reply.status(200).send(llmCall)
      } catch (error) {
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
