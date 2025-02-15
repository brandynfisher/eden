'use client'

import { Component, ErrorInfo, PropsWithChildren } from 'react'

interface State {
  hasError: boolean
  error: Error | null
  retryCount: number
}

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

export class AuthErrorBoundary extends Component<PropsWithChildren, State> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error:', error, errorInfo)
  }

  async retryAuth() {
    const { retryCount } = this.state
    if (retryCount >= MAX_RETRIES) {
      console.error('Max retry attempts reached for auth')
      return
    }

    // Exponential backoff
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
    await new Promise(resolve => setTimeout(resolve, delay))

    this.setState(
      prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
      }),
      () => {
        // Force a reload of the auth state
        window.location.reload()
      },
    )
  }

  render() {
    if (this.state.hasError) {
      const isTokenError = this.state.error?.message?.includes(
        'Token refresh failed',
      )

      if (isTokenError && this.state.retryCount < MAX_RETRIES) {
        this.retryAuth()
        return <div>Reconnecting to authentication service...</div>
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
          <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
          <p className="text-sm text-gray-500 mb-4">
            There was a problem with the authentication service.
          </p>
          <button
            onClick={() => this.retryAuth()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
