import { User } from '../../models/User'
import { ConceptV2 } from '../../models/v2/ConceptV2'
// import { s3Url } from '../../plugins/s3Plugin' // Not needed for now
import ConceptV2Repository from '../../repositories/ConceptV2Repository'
// interface UserConceptsGetArguments {} // Not needed
import { FastifyReply, FastifyRequest } from 'fastify'
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

  const concepts = await conceptsRepository.query(
    {
      user: user._id,
    },
    {
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
    },
  )

  return reply.status(200).send({ concepts: concepts.docs })
}

export const createConcept = async (
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

  if (!name || !images || images.length === 0 || images.length > 25) {
    return reply.status(422).send({
      message: 'Name and images (1-25) are required',
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

    return reply.status(201).send({ concept })
  } catch (error) {
    console.error('Error creating concept:', error)
    return reply.status(500).send({
      message: 'Error creating concept',
    })
  }
}

export const updateConcept = async (
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

  if (images && (images.length === 0 || images.length > 25)) {
    return reply.status(422).send({
      message: 'Images array must contain between 1 and 25 items',
    })
  }

  const concept = await ConceptV2.findOne({
    _id: conceptId,
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
