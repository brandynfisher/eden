import { afterEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'
import '@testing-library/jest-dom/jest-globals'

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver

afterEach(() => {
  jest.clearAllMocks()
})
