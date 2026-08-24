import { User } from '../../models/User'
import { ConceptV2 } from '../../models/v2/ConceptV2'
// import { s3Url } from '../../plugins/s3Plugin' // Not needed for now
import ConceptV2Repository from '../../repositories/ConceptV2Repository'
import axios from 'axios'
// interface UserConceptsGetArguments {} // Not needed
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Types } from 'mongoose'

// Local type definitions to avoid circular dependencies
interface ConceptCreateArguments {
  name: string
  agent?: string
  usage_instructions?: string
  images: Array<{
    image: string
    usage_instructions: string
  }>
}

interface ConceptUpdateArguments {
  conceptId: string
  name?: string
  agent?: string
  usage_instructions?: string
  images?: Array<{
    image: string
    usage_instructions: string
  }>
}

interface ConceptDeleteArguments {
  conceptId: string
}

export const listUserConcepts = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const conceptsRepository = new ConceptV2Repository(ConceptV2)

  // Get agent query parameter
  const { agent } = request.query as { agent?: string }

  // Build query: if agent is provided, filter by agent; otherwise filter by user
  // The agent branch previously dropped user scoping, listing every user's
  // concepts for that agent. Filter by agent AND owner.
  const query = agent
    ? { agent: new Types.ObjectId(agent), user: user._id }
    : { user: user._id }

  const concepts = await conceptsRepository.query(query, {
    sort: {
      createdAt: -1,
    },
    populate: [
      {
        path: 'user',
        select: '_id userId username userImage',
      },
      {
        path: 'agent',
        select: '_id userId username userImage',
      },
      {
        path: 'sdxl_lora',
        select: '_id name thumbnail',
      },
      {
        path: 'flux_lora',
        select: '_id name thumbnail',
      },
    ],
  })

  return reply.status(200).send({ concepts: concepts.docs })
}

export const createConcept = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  const { name, agent, usage_instructions, images } =
    request.body as ConceptCreateArguments

  if (!name || !images || images.length === 0 || images.length > 100) {
    return reply.status(422).send({
      message: 'Name and images (1-100) are required',
    })
  }

  // Validate all images have usage instructions
  for (const image of images) {
    if (!image.image || !image.usage_instructions) {
      return reply.status(422).send({
        message: 'All images must have image URL and usage instructions',
      })
    }
  }

  try {
    const concept = await ConceptV2.create({
      name,
      user: user._id,
      agent: agent ? new Types.ObjectId(agent) : undefined,
      usage_instructions,
      images,
    })

    await concept.populate([
      {
        path: 'user',
        select: '_id userId username userImage',
      },
    ])

    // Make admin API call to Eve Admin API
    try {
      await axios.post(
        `${server.config.EDEN_COMPUTE_API_URL}/concepts/create`,
        {
          concept: concept._id.toString(),
        },
        {
          headers: {
            Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
          },
        },
      )
    } catch (error) {
      server.log.error(
        { err: error },
        'Failed to notify Eve Admin API about concept creation:',
      )
      // Continue even if admin API call fails
    }

    return reply.status(201).send({ concept })
  } catch (error) {
    console.error('Error creating concept:', error)
    return reply.status(500).send({
      message: 'Error creating concept',
    })
  }
}

export const updateConcept = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { conceptId } = request.params as { conceptId: string }
  const { name, agent, usage_instructions, images } =
    request.body as ConceptUpdateArguments

  if (images && (images.length === 0 || images.length > 100)) {
    return reply.status(422).send({
      message: 'Images array must contain between 1 and 100 items',
    })
  }

  const concept = await ConceptV2.findOne({
    _id: conceptId,
    // Concepts are strictly user-owned — there is no public/shared field on
    // ConceptV2 — so scope every lookup by owner. Matching on _id alone let any
    // authenticated caller read, rename, repoint `agent` at their own agent
    // (triggering a retrain), replace the training images, or soft-delete
    // anyone else's concept.
    user: userId,
  })

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  if (name !== undefined) {
    concept.name = name
  }

  if (agent !== undefined) {
    concept.agent = agent ? new Types.ObjectId(agent) : undefined
  }

  if (usage_instructions !== undefined) {
    concept.usage_instructions = usage_instructions
  }

  if (images !== undefined) {
    // Validate all images have usage instructions
    for (const image of images) {
      if (!image.image || !image.usage_instructions) {
        return reply.status(422).send({
          message: 'All images must have image URL and usage instructions',
        })
      }
    }
    concept.images = images
  }

  await concept.save()

  await concept.populate([
    {
      path: 'user',
      select: '_id userId username userImage',
    },
  ])

  // Make admin API call to Eve Admin API
  try {
    await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/concepts/update`,
      {
        concept: concept._id.toString(),
      },
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )
  } catch (error) {
    server.log.error(
      { err: error },
      'Failed to notify Eve Admin API about concept update:',
    )
    // Continue even if admin API call fails
  }

  return reply.status(200).send({
    concept,
  })
}

export const getConcept = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { conceptId } = request.params as { conceptId: string }

  const concept = await ConceptV2.findOne({
    _id: conceptId,
    // Concepts are strictly user-owned — there is no public/shared field on
    // ConceptV2 — so scope every lookup by owner. Matching on _id alone let any
    // authenticated caller read, rename, repoint `agent` at their own agent
    // (triggering a retrain), replace the training images, or soft-delete
    // anyone else's concept.
    user: userId,
  }).populate([
    {
      path: 'user',
      select: '_id userId username userImage',
    },
    {
      path: 'agent',
      select: '_id userId username userImage',
    },
    {
      path: 'sdxl_lora',
      select: '_id name thumbnail',
    },
    {
      path: 'flux_lora',
      select: '_id name thumbnail',
    },
  ])

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  return reply.status(200).send({ concept })
}

export const deleteConcept = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { conceptId } = request.params as ConceptDeleteArguments

  const concept = await ConceptV2.findOne({
    _id: conceptId,
    // Concepts are strictly user-owned — there is no public/shared field on
    // ConceptV2 — so scope every lookup by owner. Matching on _id alone let any
    // authenticated caller read, rename, repoint `agent` at their own agent
    // (triggering a retrain), replace the training images, or soft-delete
    // anyone else's concept.
    user: userId,
  })

  if (!concept) {
    return reply.status(404).send({
      message: 'Concept not found',
    })
  }

  concept.deleted = true
  await concept.save()

  return reply.status(200).send({
    success: true,
  })
}
