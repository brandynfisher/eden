import {
  CollectionsAddCreationsArguments,
  CollectionsCreateArguments,
  CollectionsDeleteArguments,
  CollectionsGetArguments,
  CollectionsListArguments,
  CollectionsRemoveCreationsArguments,
  CollectionsUpdateArguments,
} from '@eden-labs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

import { Collection } from '../models/Collection'
import { Creation } from '../models/Creation'
import { User } from '../models/Creator'
import CollectionRepository from '../repositories/CollectionRepository'
import CreationRepository from '../repositories/CreationRepository'
import CreatorRepository from '../repositories/CreatorRepository'

const getDefaultCollection = async (user: ObjectId) => {
  let collection = await Collection.findOne({ isDefaultCollection: true, user })

  // Create the default collection if it doesn't exist
  if (!collection) {
    collection = await Collection.create({
      name: 'Bookmarks',
      description: 'My bookmarked creations',
      isDefaultCollection: true,
      user,
    })
  }

  return collection
}

export const getCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { collectionId } = request.params as CollectionsGetArguments
  const collection = await Collection.findById(collectionId)
  return reply.status(200).send({ collection })
}

export const listCollections = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort } =
    request.query as CollectionsListArguments

  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId,
  })

  const collectionRepository = new CollectionRepository(Collection)
  const collections = await collectionRepository.query(
    {
      user: creators.docs
        ? creators.docs.map(creator => creator._id)
        : undefined,
    },
    {
      limit,
      page,
      sort,
    },
  )

  const creationRepository = new CreationRepository(Creation)

  const collectionDocs = collections.docs.map(async collection => {
    let displayThumbnail = ''
    const creations = await creationRepository.query(
      {
        /* Query to find creations for the current collection, based on your schema design */
      },
      { sort: { createdAt: -1 }, limit: 1 },
    )
    // If there are any creations for the collection, add the latest one
    if (creations.docs.length > 0) {
      displayThumbnail = creations.docs[0].thumbnail || ''
    }
    return {
      ...collection.toObject(),
      displayThumbnail,
    }
  })

  const response = {
    ...collections,
    docs: await Promise.all(collectionDocs),
  }

  return reply.status(200).send(response)
}

export const createCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { name, description, creationIds } =
    request.body as CollectionsCreateArguments

  // validate creations
  let creations
  if (creationIds) {
    creations = await Creation.find({ _id: { $in: creationIds } })
    if (creations.length !== creationIds.length) {
      return reply.status(400).send({
        message: 'Invalid creation(s)',
      })
    }
  }

  const collection = await Collection.create({
    name,
    description,
    creations: creations ? creations.map(creation => creation._id) : undefined,
    user: userId,
  })

  return reply.status(200).send({ collectionId: collection._id })
}

export const deleteCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { collectionId } = request.params as CollectionsDeleteArguments
  const collection = await Collection.findOne({
    _id: collectionId,
    user: userId,
  })
  if (!collection) {
    return reply.status(400).send({
      message: 'Invalid collection',
    })
  }
  await collection.delete()
  return reply.status(200).send({})
}

export const updateCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { collectionId, name, description } =
    request.body as CollectionsUpdateArguments

  let collection

  if (collectionId) {
    collection = await Collection.findOne({
      _id: collectionId,
      user: userId,
    })
    if (!collection) {
      return reply.status(400).send({
        message: 'Invalid collection',
      })
    }
  } else {
    // Get the default collection
    collection = await getDefaultCollection(userId)
  }

  await collection.updateOne({
    name,
    description,
  })

  return reply.status(200).send({})
}

export const addCreationsToCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { collectionId, creationIds } =
    request.body as CollectionsAddCreationsArguments

  let collection

  if (collectionId) {
    collection = await Collection.findOne({
      _id: collectionId,
      user: userId,
    })
  } else {
    // Get the default collection
    collection = await getDefaultCollection(userId)
  }

  if (!collection) {
    return reply.status(400).send({
      message: 'Invalid collection',
    })
  }

  // validate creations
  const creationDocs = await Creation.find({ _id: { $in: creationIds } })
  if (creationDocs.length !== creationIds.length) {
    return reply.status(400).send({
      message: 'Invalid creation(s)',
    })
  }

  await collection.updateOne({
    $addToSet: {
      creations: { $each: creationDocs.map(c => c._id) },
    },
  })

  return reply.status(200).send({})
}

export const removeCreationsFromCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { collectionId, creationIds } =
    request.body as CollectionsRemoveCreationsArguments

  let collection

  if (collectionId) {
    collection = await Collection.findOne({
      _id: collectionId,
      user: userId,
    })
  } else {
    // Get the default collection
    collection = await getDefaultCollection(userId)
  }

  if (!collection) {
    return reply.status(400).send({
      message: 'Invalid collection',
    })
  }

  // validate creations
  const creationDocs = await Creation.find({ _id: { $in: creationIds } })
  if (creationDocs.length !== creationIds.length) {
    return reply.status(400).send({
      message: 'Invalid creation(s)',
    })
  }

  // Remove creations from collection
  const creationIdsToRemove = creationDocs.map(creation => creation._id)
  await Collection.updateOne(
    { _id: collection._id },
    { $pullAll: { creations: creationIdsToRemove } },
  )

  return reply.status(200).send({})
}
