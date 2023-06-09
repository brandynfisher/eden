import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'
import { expect, test } from 'vitest'

import { Transaction } from '../../../src/models/Transaction'
import { prepareAdminHeaders } from '../../util'

const addMannaRequest = async (
  server: FastifyInstance,
  userId: string,
  amount: number,
) => {
  const headers = prepareAdminHeaders()
  const response = await server.inject({
    method: 'POST',
    url: '/admin/manna/modify',
    payload: {
      userId,
      amount,
    },
    headers,
  })
  return response
}

test('Admin can modify Manna', async context => {
  const { server } = context
  const response = await addMannaRequest(server, 'user', 100)
  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveProperty('userId')
  expect(response.json()).toHaveProperty('manna')
  expect(response.json()).toHaveProperty('transactionId')
  expect(response.json().manna).toBe(1100)

  // Get the transaction from the database
  const transactionId = new ObjectId(response.json().transactionId)
  const transaction = await Transaction.findById(transactionId)
  expect(transaction).not.toBe(null)
})
