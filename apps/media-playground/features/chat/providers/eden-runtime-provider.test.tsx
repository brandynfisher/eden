import { EdenRuntimeProvider } from '@/features/chat/providers/eden-runtime-provider'
import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'

jest.mock('@/features/chat/hooks/useEdenRuntime', () => ({
  useEdenRuntime: jest.fn(() => ({})),
}))

describe('initializes useEdenRuntime with correct configuration', () => {
  it('renders EdenRuntimeProvider and children', () => {
    render(
      <EdenRuntimeProvider>
        <div data-testid="child-element">Hello</div>
      </EdenRuntimeProvider>,
    )

    const child = screen.getByTestId('child-element')
    expect(child).toBeInTheDocument()
    expect(child).toHaveTextContent('Hello')
  })
})
