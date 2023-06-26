import {
  CapabilitiesCreateArguments,
  CapabilitiesDeleteArguments,
  CapabilitiesGetArguments,
  CapabilitiesListArguments,
  CapabilitiesUpdateArguments,
} from '@eden-labs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { Capability, CapabilityType } from '../models/Capability'
import { Character } from '../models/Character'
import CapabilityRepository from '../repositories/CapabilityRepository'
import CharacterRepository from '../repositories/CharacterRepository'

export const createCapability = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { characterId, name, type, data } =
    request.body as CapabilitiesCreateArguments

  const input = {
    user: userId,
    character: characterId,
    name,
    type,
    data,
  }

  const character = await Character.findOne({
    characterId,
    user: userId,
  })

  if (!character) {
    return reply.status(401).send({
      message: 'Character not found',
    })
  }

  if (!Object.values(CapabilityType).includes(type)) {
    return reply.status(400).send({
      message: 'Capability type not found',
    })
  }

  const capabilityRepository = new CapabilityRepository(Capability)
  const capability = await capabilityRepository.create(input)

  character.capabilities.push(capability._id)
  await character.save()

  return reply.status(200).send({
    capabilityId: capability._id,
  })
}

export const updateCapability = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { capabilityId, name, data } =
    request.body as CapabilitiesUpdateArguments

  if (!capabilityId) {
    return reply.status(400).send({
      message: 'You must provide an capabilityId',
    })
  }

  const capability = await Capability.findOne({
    capabilityId,
    user: userId,
  })

  if (!capability) {
    return reply.status(401).send({
      message: 'Capability not found',
    })
  }

  const input = {
    name,
    data,
  }

  await capability.update(input)

  return reply.status(200).send({ capabilityId })
}

export const deleteCapability = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { capabilityId } = request.body as CapabilitiesDeleteArguments

  if (!capabilityId) {
    return reply.status(400).send({
      message: 'You must provide an capabilityId',
    })
  }

  const dbCapability = await Capability.findOne({
    capabilityId,
    user: userId,
  })

  if (!dbCapability) {
    return reply.status(401).send({
      message: 'Capability not found',
    })
  }

  await dbCapability.delete()

  return reply.status(200).send({})
}

export const listCapabilities = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { characterId, limit, page, sort } =
    request.query as CapabilitiesListArguments

  const characterRepository = new CharacterRepository(Character)
  const characters = await characterRepository.query({
    characterId,
  })

  const capabilityRepository = new CapabilityRepository(Capability)
  const capabilityPaginatedResponse = await capabilityRepository.query(
    {
      user: userId,
      character: characters.docs
        ? characters.docs.map(character => character._id)
        : undefined,
    },
    {
      limit,
      page,
      sort,
    },
  )
  const response = {
    ...capabilityPaginatedResponse,
    docs: capabilityPaginatedResponse.docs.map(capability => ({
      id: capability._id,
      name: capability.name,
      type: capability.type,
      data: capability.data,
    })),
  }

  return reply.status(200).send(response)
}

export const getCapability = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { capabilityId } = request.params as CapabilitiesGetArguments
  const capability = await Capability.findOne({ capabilityId })
  if (!capability) {
    return reply.status(404).send({
      message: 'Capability not found',
    })
  }

  const response = {
    id: capability._id,
    name: capability.name,
    type: capability.type,
    data: capability.data,
  }

  return reply.status(200).send({ capability: response })
}
