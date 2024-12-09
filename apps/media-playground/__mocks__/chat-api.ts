import { jest } from '@jest/globals'

export const getThread = jest.fn(async () => {
  return {
    messages: [],
  }
})

export const sendMessage = jest.fn(async ({ messages }) => {
  return {
    status: 200,
    data: {
      thread_id: 'mock-thread-id',
      message: messages[0],
    },
  }
})
