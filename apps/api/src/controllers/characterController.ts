import {
  CharactersCreateArguments,
  CharactersDeleteArguments,
  CharactersGetArguments,
  CharactersListArguments,
  CharactersUpdateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { Character } from '../models/Character'
import { User } from '../models/Creator'
import CharacterRepository from '../repositories/CharacterRepository'
import CreatorRepository from '../repositories/CreatorRepository'

export const createCharacter = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { name, image, voice, description, greeting, dialogue } =
    request.body as CharactersCreateArguments

  const input = {
    user: userId,
    name,
    image,
    voice,
    description,
    greeting,
    dialogue,
  }

  const characterRepository = new CharacterRepository(Character)
  const character = await characterRepository.create(input)

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
  const { characterId, name, image, voice, description, greeting, dialogue } =
    request.body as CharactersUpdateArguments

  if (!characterId) {
    return reply.status(400).send({
      message: 'You must provide an characterId',
    })
  }

  const character = await Character.findOne({
    _id: characterId,
    user: userId,
  })

  if (!character) {
    return reply.status(401).send({
      message: 'Character not found',
    })
  }

  const input = {
    name,
    image,
    voice,
    description,
    greeting,
    dialogue,
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
  const response = {
    ...characterPaginatedResponse,
    docs: characterPaginatedResponse.docs.map(character => ({
      id: character._id.toString(),
      user: character.user.toString(),
      name: character.name,
      slug: character.slug,
      image: character.image,
      voice: character.voice,
      description: character.description,
      greeting: character.greeting,
      dialogue: character.dialogue,
    })),
  }

  return reply.status(200).send(response)
}

export const getCharacter = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { slug } = request.params as CharactersGetArguments
  const character = await Character.findOne({ slug })
  if (!character) {
    return reply.status(404).send({
      message: 'Character not found',
    })
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
  }

  return reply.status(200).send({ character: response })
}
