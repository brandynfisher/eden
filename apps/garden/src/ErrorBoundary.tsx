import * as Sentry from '@sentry/nextjs'
import { Button } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import React, { ErrorInfo, ReactNode } from 'react'

interface State {
  hasError: boolean
}

interface Props {
  children: ReactNode
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  constructor(props: Props) {
    super(props)
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can use your own error logging service here
    console.log({ error, errorInfo })
    Sentry.captureException(error)
  }

  render() {
    // Check if the error is thrown
    if (this.state.hasError) {
      // Render custom fallback UI
      return (
        <section className="block">
          <div className="px-5 md:px-10">
            <div className="py-16 md:py-24 lg:py-32">
              <div className="mx-auto flex-col flex w-full max-w-3xl items-center">
                <div className="relative h-48 w-48">
                  <Image
                    fill={true}
                    style={{ objectFit: 'contain' }}
                    src="/placeholder.png"
                    alt=""
                    className="mb-8 mx-auto inline-block max-w-full flex-none object-cover"
                  />
                </div>
                <div className="text-center">
                  <h2 className="font-bold mb-4 text-2xl md:text-4xl">
                    Client-side Exception
                  </h2>
                  <div className="mx-auto max-w-[528px] mb-5 md:mb-6 lg:mb-8">
                    <p className="text-[#636262] max-[479px]:text-sm">
                      Uh-oh! 🌿 It appears your digital compass got a little too
                      curious. You've entered the Enigmatic Grove of client-side
                      Conundrums 🍄🧚‍️
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      type="primary"
                      className="font-mono"
                      onClick={() => this.setState({ hasError: false })}
                    >
                      Try again?
                    </Button>
                    <Link href="/" passHref>
                      <Button
                        className="font-mono"
                        onClick={() => this.setState({ hasError: false })}
                      >
                        Go back Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )
    }

    // Return children components in case of no error
    return this.props.children
  }
}

export default ErrorBoundary
