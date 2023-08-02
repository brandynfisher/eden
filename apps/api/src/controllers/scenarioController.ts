import {
  ScenarioType,
  ScenariosCreateArguments,
  ScenariosDeleteArguments,
  ScenariosGetArguments,
  ScenariosListArguments,
  ScenariosUpdateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { User } from '../models/Creator'
import { Scenario } from '../models/Scenario'
import CreatorRepository from '../repositories/CreatorRepository'
import ScenarioRepository from '../repositories/ScenarioRepository'

export const createScenario = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { name, description, type, data } =
    request.body as ScenariosCreateArguments

  if (!Object.values(ScenarioType).includes(type)) {
    return reply.status(400).send({
      message: 'Scenario type not found',
    })
  }

  const input = {
    user: userId,
    name,
    description,
    type,
    data,
  }

  const scenarioRepository = new ScenarioRepository(Scenario)
  const scenario = await scenarioRepository.create(input)

  return reply.status(200).send({
    scenarioId: scenario._id,
  })
}

export const updateScenario = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { scenarioId, name, description, data } =
    request.body as ScenariosUpdateArguments

  if (!scenarioId) {
    return reply.status(400).send({
      message: 'You must provide an scenarioId',
    })
  }

  const scenario = await Scenario.findOne({
    user: userId,
    scenarioId,
  })

  if (!scenario) {
    return reply.status(401).send({
      message: 'Scenario not found',
    })
  }

  const input = {
    name,
    description,
    data,
  }

  await scenario.update(input)

  return reply.status(200).send({ scenarioId })
}

export const deleteScenario = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { scenarioId } = request.body as ScenariosDeleteArguments

  if (!scenarioId) {
    return reply.status(400).send({
      message: 'You must provide an scenarioId',
    })
  }

  const dbScenario = await Scenario.findOne({
    scenarioId,
    user: userId,
  })

  if (!dbScenario) {
    return reply.status(401).send({
      message: 'Scenario not found',
    })
  }

  await dbScenario.delete()

  return reply.status(200).send({})
}

export const listScenarios = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort } = request.query as ScenariosListArguments

  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId,
  })

  const scenarioRepository = new ScenarioRepository(Scenario)
  const scenarioPaginatedResponse = await scenarioRepository.query(
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
    ...scenarioPaginatedResponse,
    docs: scenarioPaginatedResponse.docs.map(scenario => ({
      id: scenario._id,
      name: scenario.name,
      description: scenario.description,
      type: scenario.type,
      data: scenario.data,
    })),
  }

  return reply.status(200).send(response)
}

export const getScenario = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { scenarioId } = request.params as ScenariosGetArguments
  const scenario = await Scenario.findOne({ scenarioId })
  if (!scenario) {
    return reply.status(404).send({
      message: 'Scenario not found',
    })
  }

  const response = {
    id: scenario._id,
    name: scenario.name,
    description: scenario.description,
    type: scenario.type,
    data: scenario.data,
  }

  return reply.status(200).send({ scenario: response })
}
