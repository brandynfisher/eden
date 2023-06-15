import { expect, test } from 'vitest'

import { createTask } from '../../../src/controllers/taskController'
import { prepareUserHeaders } from '../../util'

test('User can list creators', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'GET',
    url: '/creators',
    headers,
  })
  expect(response.statusCode).toBe(200)
  const json = response.json()
  expect(json).toHaveProperty('docs')
  expect(json.docs.length).toBeGreaterThan(0)
})

test('User can get a creator by ID', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'GET',
    url: `/creators/user`,
    headers,
  })
  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveProperty('creator')
})

test('User can follow a creator', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/creators/follow',
    payload: {
      userId: 'admin',
    },
    headers,
  })
  console.log(response.json())
  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveProperty('success')
  expect(response.json().success).toBe(true)
})

test('User cannot follow the same creator twice', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/creators/follow',
    payload: {
      userId: 'admin',
    },
    headers,
  })
  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveProperty('success')

  const response2 = await server.inject({
    method: 'POST',
    url: '/creators/follow',
    payload: {
      userId: 'admin',
    },
    headers,
  })
  expect(response2.statusCode).toBe(400)
})

test('User cannot follow themselves', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/creators/follow',
    payload: {
      userId: headers['x-user-id'],
    },
    headers,
  })
  expect(response.statusCode).toBe(400)
})

test('User can unfollow a creator', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const followResponse = await server.inject({
    method: 'POST',
    url: '/creators/follow',
    payload: {
      userId: 'admin',
    },
    headers,
  })
  const response = await server.inject({
    method: 'POST',
    url: '/creators/unfollow',
    payload: {
      userId: 'admin',
    },
    headers,
  })
  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveProperty('success')
  expect(response.json().success).toBe(true)
})

test('User cannot unfollow a creator they are not following', async context => {
  const { server } = context
  const headers = prepareUserHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/creators/unfollow',
    payload: {
      userId: 'admin',
    },
    headers,
  })
  expect(response.statusCode).toBe(400)
})
