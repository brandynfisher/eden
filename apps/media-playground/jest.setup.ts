import { afterEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver

afterEach(() => {
  jest.clearAllMocks()
})
