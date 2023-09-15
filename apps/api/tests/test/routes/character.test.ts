import { FastifyInstance } from 'fastify'
import { expect, test } from 'vitest'

import { prepareUserHeaders } from '../../util'

const createCharacter = async (server: FastifyInstance) => {
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/characters/create',
    headers,
    payload: {
      name: 'Test Character',
      description: 'Test Description',
      greeting: 'Test Greeting',
      dialogue: 'Test Dialogue',
    },
  })
  return response
}

const listCharacters = async (server: FastifyInstance) => {
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'GET',
    url: '/characters',
    headers,
  })
  return response
}

const getCharacter = async (server: FastifyInstance, slug: string) => {
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'GET',
    url: `/characters/${slug}`,
    headers,
  })
  return response
}

const deleteCharacter = async (
  server: FastifyInstance,
  characterId: string,
) => {
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/characters/delete',
    headers,
    payload: {
      characterId,
    },
  })
  return response
}

test('User can create an Character', async context => {
  const { server } = context
  const response = await createCharacter(server)
  expect(response.statusCode).toBe(200)
  const json = response.json()
  expect(json).toHaveProperty('characterId')
})

test('User can list their Characters', async context => {
  const { server } = context
  await createCharacter(server)
  const response = await listCharacters(server)
  expect(response.statusCode).toBe(200)
  const json = response.json()
  expect(json).toHaveProperty('docs')
  expect(json.docs).toHaveLength(1)
})

test('User can delete an Character', async context => {
  const { server } = context
  await createCharacter(server)
  const getResponse = await listCharacters(server)
  const characters = getResponse.json().docs
  const character = characters[0].id
  const deleteResponse = await deleteCharacter(server, character)
  expect(deleteResponse.statusCode).toBe(200)
  const getResponse2 = await listCharacters(server)
  const json = getResponse2.json()
  expect(json).toHaveProperty('docs')
  expect(json.docs).toHaveLength(0)
})

test('Can get a character by ID', async context => {
  const { server } = context
  const createResponse = await createCharacter(server)
  const slug = createResponse.json().slug
  const getResponse = await getCharacter(server, slug)
  expect(getResponse.statusCode).toBe(200)
  const json = getResponse.json()
  expect(json).toHaveProperty('character')
  expect(json.character).toHaveProperty('name')
})
