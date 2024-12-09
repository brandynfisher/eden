import { jest } from '@jest/globals'

export const useEdenRuntime = jest.fn(() => {
  return {
    isRunning: false,
    messages: [],
    setMessages: jest.fn(),
    onNew: jest.fn(),
  }
})
