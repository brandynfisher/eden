import LayoutHeader from '@/components/Layout/LayoutHeader'
import { Layout, Spin } from 'antd'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Key, SWRConfig, SWRConfiguration, SWRHook } from 'swr'
import { BareFetcher, FetcherResponse } from 'swr/_internal'

const InfiniteLoadingIndicator = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <div
      className={`${
        isLoading ? 'anim-fade-in' : 'anim-fade-out'
      } z-10 fixed flex p-4 justify-end w-full bottom-0 right-0 pointer-events-none bg-opacity-60`}
    >
      <div className="text-xs flex w-1/4 bg-gray-200 dark:bg-gray-800 p-2 !bg-opacity-60 rounded-lg">
        <Spin size="small" />
      </div>
    </div>
  )
}

type Args = []
type Data = Promise<[]>

const CustomLayout = ({ children }: PropsWithChildren) => {
  const [requestCount, setRequestCount] = useState(0)
  const [showLoading, setShowLoading] = useState(false)

  function requestCounter(useSWRInfinite: SWRHook): FetcherResponse {
    return (
      key: Key,
      fetcher: BareFetcher<Data> | null,
      config: SWRConfiguration,
    ) => {
      const extendedFetcher = (...args: Args[]) => {
        setRequestCount(prev => prev + 1)

        if (!fetcher) {
          return
        }

        return fetcher(...args).finally(() => setRequestCount(prev => prev - 1))
      }

      return useSWRInfinite(key, extendedFetcher, config)
    }
  }

  useEffect(() => {
    if (requestCount > 0) {
      setShowLoading(true)
    } else {
      setShowLoading(false)
    }
  }, [requestCount])

  return (
    // @ts-ignore
    <SWRConfig value={{ use: [requestCounter] }}>
      <Layout className="min-h-screen flex flex-col">
        <LayoutHeader />
        <Layout className="p-4 bg-white dark:bg-gray-950">{children}</Layout>
        <InfiniteLoadingIndicator isLoading={showLoading} />
      </Layout>
    </SWRConfig>
  )
}

export default CustomLayout
