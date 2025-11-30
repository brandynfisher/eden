import {
  VerdelisSeedV2,
  VerdelisSeedV2Document,
} from '../../models/v2/VerdelisSeedV2'
import { forceCloudfrontUrl } from '../../plugins/s3Plugin'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

interface ListVerdelisSeedsQuery {
  agentId?: string
  page?: number
  limit?: number
}

export const listVerdelisSeeds = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const {
    agentId,
    page = 1,
    limit = 20,
  } = request.query as ListVerdelisSeedsQuery

  const filter: any = { deleted: { $ne: true } }

  if (agentId) {
    filter.agents = new ObjectId(agentId)
  }

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'agents',
        select: '_id username name userImage type',
        model: 'users3',
      },
    ],
  }

  const result = await (VerdelisSeedV2 as any).paginate(filter, options)

  // Process agents to add cloudfront URLs
  const docsWithUrls = result.docs.map((doc: any) => {
    const seed = typeof doc.toObject === 'function' ? doc.toObject() : doc
    if (seed.agents) {
      seed.agents = seed.agents.map((agent: any) => {
        if (agent?.userImage) {
          agent.userImage = forceCloudfrontUrl(server, agent.userImage)
        }
        return agent
      })
    }
    return seed
  })

  return reply.status(200).send({
    docs: docsWithUrls,
    total: result.totalDocs,
    limit: result.limit,
    pages: result.totalPages,
    page: result.page,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  })
}

export const getVerdelisSeed = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { seedId } = request.params as { seedId: string }

  const seed = (await VerdelisSeedV2.findOne({
    _id: seedId,
    deleted: { $ne: true },
  }).populate({
    path: 'agents',
    select: '_id username name userImage type',
    model: 'users3',
  })) as VerdelisSeedV2Document | null

  if (!seed) {
    return reply.status(404).send({
      message: 'Seed not found',
    })
  }

  const seedObj = seed.toObject() as any
  if (seedObj.agents) {
    seedObj.agents = seedObj.agents.map((agent: any) => {
      if (agent?.userImage) {
        agent.userImage = forceCloudfrontUrl(server, agent.userImage)
      }
      return agent
    })
  }

  return reply.status(200).send({ seed: seedObj })
}
