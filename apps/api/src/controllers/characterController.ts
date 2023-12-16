import {
  CharactersCreateArguments,
  CharactersDeleteArguments,
  CharactersGetArguments,
  CharactersListArguments,
  CharactersUpdateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

import { ApiKey } from '../models/ApiKey'
import { Character } from '../models/Character'
import { User } from '../models/Creator'
import ApiKeyRepository from '../repositories/ApiKeyRepository'
import CharacterRepository from '../repositories/CharacterRepository'
import CreatorRepository from '../repositories/CreatorRepository'
import { generateApiKey } from './apiKeyController'

export const createCharacter = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const {
    name,
    image,
    voice,
    description,
    greeting,
    dialogue,
    concept,
    logosData,
    isPrivate,
  } = request.body as CharactersCreateArguments

  const input: {
    user: ObjectId
    name: string
    image: string | undefined
    voice: string | undefined
    description: string | undefined
    greeting: string | undefined
    dialogue: any[] | undefined
    concept: string | undefined
    logosData: any | undefined
    isPrivate?: boolean
  } = {
    user: userId,
    name,
    image,
    voice,
    description,
    greeting,
    dialogue,
    concept,
    logosData,
    isPrivate,
  }

  const characterRepository = new CharacterRepository(Character)
  const character = await characterRepository.create(input)

  // Create API Key for character
  const { apiKey, apiSecret } = generateApiKey()
  const apiKeyInput = {
    user: userId,
    character: character._id,
    apiKey,
    apiSecret,
  }

  const apiKeyRepository = new ApiKeyRepository(ApiKey)
  await apiKeyRepository.create(apiKeyInput)

  return reply.status(200).send({
    characterId: character._id,
    slug: character.slug,
  })
}

export const updateCharacter = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { characterId } = request.params as CharactersUpdateArguments

  if (!characterId) {
    return reply.status(400).send({
      message: 'You must provide a characterId',
    })
  }

  const {
    name,
    image,
    voice,
    description,
    greeting,
    dialogue,
    concept,
    logosData,
    isPrivate,
  } = request.body as CharactersUpdateArguments

  const character = await Character.findOne({
    _id: characterId,
    user: userId,
  })

  if (!character) {
    return reply.status(401).send({
      message: 'Character not found',
    })
  }

  const input: {
    name: string | undefined
    image: string | undefined
    voice: string | undefined
    description: string | undefined
    greeting: string | undefined
    dialogue: any[] | undefined
    concept: string | undefined
    logosData: any | undefined
    isPrivate?: boolean
  } = {
    name,
    image,
    voice,
    description,
    greeting,
    dialogue,
    concept,
    logosData,
    isPrivate,
  }

  await character.update(input)

  return reply.status(200).send({ characterId })
}

export const deleteCharacter = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { characterId } = request.body as CharactersDeleteArguments

  const dbCharacter = await Character.findOne({
    _id: characterId,
    user: userId,
  })

  if (!dbCharacter) {
    return reply.status(401).send({
      message: 'Character not found',
    })
  }

  await dbCharacter.delete()

  return reply.status(200).send({})
}

export const listCharacters = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort } = request.query as CharactersListArguments

  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId,
  })

  const characterRepository = new CharacterRepository(Character)
  const characterPaginatedResponse = await characterRepository.query(
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

  await characterRepository.model.populate(characterPaginatedResponse.docs, {
    path: 'user',
    select: 'userId username userImage',
  })

  const response = {
    ...characterPaginatedResponse,
    docs: characterPaginatedResponse.docs.map(character => ({
      id: character._id.toString(),
      user: character.user,
      name: character.name,
      slug: character.slug,
      image: character.image,
      voice: character.voice,
      description: character.description,
      greeting: character.greeting,
      dialogue: character.dialogue,
      logosData: character.logosData,
      concept: character.concept,
      creationCount: character.creationCount,
      isPrivate: character.isPrivate,
    })),
  }

  return reply.status(200).send(response)
}

export const getCharacter = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { characterId } = request.params as CharactersGetArguments
  const character = await Character.findOne({ _id: characterId })
  if (!character) {
    return reply.status(404).send({
      message: 'Character not found',
    })
  }

  if (character.isPrivate) {
    if (character.user.toString() !== request.user?.userId.toString()) {
      console.error('User not authorized to view this')
      return reply.status(401).send({
        message: 'User not authorized to view this',
      })
    }
  }

  const response = {
    id: character._id,
    user: character.user.toString(),
    name: character.name,
    slug: character.slug,
    image: character.image,
    voice: character.voice,
    description: character.description,
    greeting: character.greeting,
    dialogue: character.dialogue,
    concept: character.concept,
    logosData: character.logosData,
    creationCount: character.creationCount,
    isPrivate: character.isPrivate,
  }

  return reply.status(200).send({ character: response })
}
