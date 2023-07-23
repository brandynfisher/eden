import LayoutHeader from '@/components/Layout/LayoutHeader'
import { Layout, Spin } from 'antd'
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useEffect,
  useState,
} from 'react'
import { Middleware } from 'swr'
import { BareFetcher, SWRConfig } from 'swr'

const InfiniteLoadingIndicator = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <div
      className={`${
        isLoading ? 'anim-fade-in' : 'anim-fade-out'
      } z-10 fixed flex p-4 justify-end w-full bottom-0 right-0 pointer-events-none bg-opacity-60`}
    >
      <div className="text-xs flex bg-gray-200 dark:bg-gray-800 p-2 !bg-opacity-60 rounded-lg">
        <Spin size="small" />
      </div>
    </div>
  )
}

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

const CustomLayout = ({ children }: PropsWithChildren) => {
  const [requestCount, setRequestCount] = useState(0)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (requestCount > 0) {
      setShowLoading(true)
    } else {
      setShowLoading(false)
    }
  }, [requestCount])

  return (
    // @ts-ignore
    <SWRConfig
      value={{ use: [myRequestCounterMiddlewareWrap(setRequestCount)] }}
    >
      <Layout className="min-h-screen flex flex-col">
        <LayoutHeader />
        <Layout className="p-4 bg-white dark:bg-gray-950">{children}</Layout>
        <InfiniteLoadingIndicator isLoading={showLoading} />
      </Layout>
    </SWRConfig>
  )
}

export default CustomLayout
