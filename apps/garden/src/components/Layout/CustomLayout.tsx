import LegacyShutdownBanner from '../Banners/LegacyShutdownBanner'
import FetchIndicator from '@/components/Layout/FetchIndicator'
import LayoutHeader from '@/components/Layout/LayoutHeader'
import RouteProgressBar from '@/components/Layout/RouteProgressBar'
import BackToTopButton from '@/components/Layout/buttons/BackToTopButton'
import { Layout } from 'antd'
import { Router } from 'next/router'
import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useEffect,
  useState,
} from 'react'
import { BareFetcher, Middleware, SWRConfig } from 'swr'

type Args = []
type Data = Promise<unknown[]>

// @ts-ignore
export const myRequestCounterMiddlewareWrap: (
  setter: Dispatch<SetStateAction<number>>,
) => Middleware = setter => {
  return useSWRNext => {
    return (key, fetcher: BareFetcher<Data | unknown>, config) => {
      // Before hook runs...

      const extendedFetcher = (...args: Args[]) => {
        setter(prev => prev + 1)

        if (!fetcher) {
          return null
        }
        // @ts-ignore
        return fetcher(...args).finally(() => setter(prev => prev - 1))
      }

      // Handle the next middleware, or the `useSWR` hook if this is the last one.
      const swr = useSWRNext(key, extendedFetcher, config)

      // After hook runs...
      return swr
    }
  }
}

const progress = new RouteProgressBar({
  size: 2,
  color: '#38a169',
  className: 'bar-of-progress',
  delay: 200,
})

const CustomLayout = ({
  fixedHeight,
  children,
}: PropsWithChildren & { fixedHeight?: boolean }) => {
  const [requestCount, setRequestCount] = useState(0)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (requestCount > 0) {
      setShowLoading(true)
    } else {
      setShowLoading(false)
    }
  }, [requestCount])

  useEffect(() => {
    Router.events.on('routeChangeStart', progress.start)
    Router.events.on('routeChangeComplete', progress.finish)
    Router.events.on('routeChangeError', progress.finish)

    return () => {
      Router.events.off('routeChangeStart', progress.start)
      Router.events.off('routeChangeComplete', progress.finish)
      Router.events.off('routeChangeError', progress.finish)
    }
  }, [])

  return (
    <SWRConfig
      value={{ use: [myRequestCounterMiddlewareWrap(setRequestCount)] }}
    >
      <Layout
        hasSider={false}
        className={`min-h-screen flex flex-col ${
          fixedHeight ? 'h-screen overflow-hidden' : ''
        }`}
      >
        <LegacyShutdownBanner
          id={'legacy_shutdown'}
          delay={200}
          reappearAfterMinutes={2}
        />
        <LayoutHeader />
        <Layout
          hasSider={false}
          className={`${fixedHeight ? '' : 'p-2 md:p-4'} lg:!pb-0`}
        >
          {children}
        </Layout>
        <div className="flex flex-col gap-4 fixed bottom-8 right-8 items-center z-[9999]">
          <FetchIndicator isLoading={showLoading} />
          <BackToTopButton />
        </div>
      </Layout>
    </SWRConfig>
  )
}

export default CustomLayout
