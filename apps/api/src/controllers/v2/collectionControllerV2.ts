import {
  CollectionV2,
  CollectionV2Document,
} from '../../models/v2/CollectionV2'
import { CreationV2 } from '../../models/v2/CreationV2'
import CollectionV2Repository from '../../repositories/CollectionV2Repository'
import {
  CollectionsV2AddCreationsArguments,
  CollectionsV2CreateArguments,
  CollectionsV2DeleteArguments,
  CollectionsV2GetArguments,
  CollectionsV2UpdateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UpdateQuery } from 'mongoose'

export const getUserCollectionsLight = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const collectionsRepository = new CollectionV2Repository(CollectionV2)
  const collections = await collectionsRepository.query(
    {
      user: currentUserId,
      deleted: false,
    },
    {
      select: '_id name',
    },
  )

  console.log(collections.docs)

  return reply.status(200).send({ collections: collections.docs })
}

export const getCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { collectionId } = request.params as CollectionsV2GetArguments

  const collectionsRepository = new CollectionV2Repository(CollectionV2)
  const collection = await collectionsRepository.findById(collectionId)

  if (!collection || collection.deleted) {
    return reply.status(404).send({
      error: 'Collection not found',
    })
  }

  const currentUserId = request.user ? request.user.userId : undefined
  const isOwnCollection =
    currentUserId && collection.user.toString() === currentUserId.toString()

  if (!isOwnCollection && !collection.public) {
    return reply.status(401).send({
      error: 'User not authorized to view this collection',
    })
  }

  await collectionsRepository.model.populate(collection, {
    path: 'user',
    select: 'userId username userImage',
  })

  return reply.status(200).send({ collection })
}

export const createCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const {
    name,
    description,
    creationIds,
    public: isPublic,
  } = request.body as CollectionsV2CreateArguments

  const currentUserId = request.user.userId

  if (creationIds) {
    const creations = await CreationV2.find(
      {
        _id: { $in: creationIds },
      },
      '_id user public',
    )

    const isAuthorized = creations.every(
      creation =>
        creation.user.toString() === currentUserId.toString() ||
        creation.public,
    )

    if (!isAuthorized) {
      return reply.status(401).send({
        error: 'User not authorized to add creations to collection',
      })
    }

    if (creations.length !== creationIds.length) {
      return reply.status(404).send({
        error: 'One or more creations not found',
      })
    }
  }

  const collection = new CollectionV2({
    user: currentUserId,
    name,
    description,
    creations: creationIds,
    public: isPublic,
  })

  await collection.save()

  return reply.status(200).send({ collectionId: collection._id })
}

export const updateCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const { collectionId } = request.params as CollectionsV2UpdateArguments
  const {
    name,
    description,
    public: isPublic,
  } = request.body as CollectionsV2UpdateArguments

  if (!collectionId) {
    return reply.status(422).send({
      error: 'Missing collectionId',
    })
  }

  const updateData: UpdateQuery<CollectionV2Document> = {
    name,
    description,
    public: isPublic,
  }

  const result = await CollectionV2.updateOne(
    {
      _id: collectionId,
      user: currentUserId,
      deleted: false,
    },
    updateData,
  )

  if (!result.matchedCount) {
    return reply.status(404).send({
      error: 'Collection not found',
    })
  }

  return reply.status(200).send({
    collectionId,
  })
}

export const deleteCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const { collectionId } = request.params as CollectionsV2DeleteArguments

  const collection = await CollectionV2.findOne({
    _id: collectionId,
  })

  if (!collection || collection.deleted) {
    return reply.status(404).send({
      message: 'Collection not found',
    })
  }

  if (collection.user.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      message: 'User not authorized to delete this',
    })
  }

  await collection.delete()

  return reply.status(200).send()
}

export const addCreationsToCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const { collectionId } = request.params as CollectionsV2AddCreationsArguments
  const { creationIds } = request.body as CollectionsV2AddCreationsArguments

  if (!collectionId) {
    return reply.status(422).send({
      error: 'Missing collectionId',
    })
  }

  const collection = await CollectionV2.findOne({
    _id: collectionId,
  })

  if (!collection || collection.deleted) {
    return reply.status(404).send({
      error: 'Collection not found',
    })
  }

  if (collection.user.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to update this collection',
    })
  }

  const creationsToAdd = await CreationV2.find({
    _id: { $in: creationIds },
  })

  if (creationsToAdd.length !== creationIds.length) {
    return reply.status(404).send({
      error: 'One or more creations not found',
    })
  }

  const isAuthorizedForCreations = creationsToAdd.every(
    creation =>
      creation.user.toString() === currentUserId.toString() || creation.public,
  )

  if (!isAuthorizedForCreations) {
    return reply.status(401).send({
      error: 'User not authorized to update creations',
    })
  }

  const shouldUpdateCoverCreation =
    typeof collection.coverCreation === 'undefined'

  if (shouldUpdateCoverCreation) {
    collection.coverCreation = creationsToAdd[0]
  }

  await CollectionV2.updateOne(
    {
      _id: collectionId,
    },
    {
      $set: shouldUpdateCoverCreation
        ? { coverCreation: collection.coverCreation }
        : {},
      $addToSet: {
        creations: { $each: creationIds },
      },
    },
  )

  return reply.status(200).send({
    collectionId,
  })
}

export const removeCreationsFromCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const { collectionId } = request.params as CollectionsV2AddCreationsArguments
  const { creationIds } = request.body as CollectionsV2AddCreationsArguments

  if (!collectionId) {
    return reply.status(422).send({
      error: 'Missing collectionId',
    })
  }

  const collection = await CollectionV2.findOne({
    _id: collectionId,
  })

  if (!collection || collection.deleted) {
    return reply.status(404).send({
      error: 'Collection not found',
    })
  }

  if (collection.user.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to update this collection',
    })
  }

  const shouldUpdateCoverCreation =
    collection.coverCreation &&
    creationIds.includes(collection.coverCreation.toString())

  if (shouldUpdateCoverCreation) {
    collection.coverCreation =
      collection.creations.find(
        creation => !creationIds.includes(creation.toString()),
      ) || undefined
  }

  await CollectionV2.updateOne(
    {
      _id: collectionId,
    },
    {
      $set:
        shouldUpdateCoverCreation && collection.coverCreation
          ? { coverCreation: collection.coverCreation }
          : {},
      $unset:
        shouldUpdateCoverCreation && !collection.coverCreation
          ? { coverCreation: '' }
          : {},
      $pullAll: {
        creations: creationIds,
      },
    },
  )

  return reply.status(200).send({
    collectionId,
  })
}
