import { expect, test } from 'vitest'

import { Reaction } from '../../../src/models/Reaction'
import { createCreation, prepareUserHeaders } from '../../util'

test('User can list creations', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'GET',
    url: '/creations',
    headers,
  })
  expect(response.statusCode).toBe(200)
  const json = response.json()
  expect(json).toHaveProperty('docs')
  expect(json.docs.length).toBeGreaterThan(0)
})

test('User can get a creation by ID', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const creation = await createCreation()
  const response = await server.inject({
    method: 'GET',
    url: `/creations/${creation.id}`,
    headers,
  })
  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveProperty('creation')
})

test('User can react to a creation', async context => {
  const { server } = context
  const creation = await createCreation()
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/creations/react',
    payload: {
      creationId: creation.id,
      reaction: 'praise',
    },
    headers,
  })
  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveProperty('success')
  expect(response.json().success).toBe(true)

  const reaction = await Reaction.findOne({
    where: {
      creationId: creation.id,
      userId: headers['x-user-id'],
    },
  })
  expect(reaction).not.toBeNull()
})

test('Reacting to a creation a second time removes the reaction', async context => {
  const { server } = context
  const creation = await createCreation()
  const headers = prepareUserHeaders()
  await server.inject({
    method: 'POST',
    url: '/creations/react',
    payload: {
      creationId: creation.id,
      reaction: 'praise',
    },
    headers,
  })
  const response = await server.inject({
    method: 'POST',
    url: '/creations/react',
    payload: {
      creationId: creation.id,
      reaction: 'praise',
    },
    headers,
  })
  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveProperty('success')
  expect(response.json().success).toBe(true)

  const reaction = await Reaction.findOne({
    where: {
      creationId: creation.id,
      userId: headers['x-user-id'],
    },
  })
  expect(reaction).toBeNull()
})

test('User cannot send an invalid reaction', async context => {
  const { server } = context
  const creation = await createCreation()
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/creations/react',
    payload: {
      creationId: creation.id,
      reaction: 'invalid',
    },
    headers,
  })
  expect(response.statusCode).toBe(400)
  expect(response.json()).toHaveProperty('message')
  expect(response.json().message).toBe('Invalid reaction')
})
