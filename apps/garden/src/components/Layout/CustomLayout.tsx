import AccountMigrationBanner from '@/components/Banners/AccountMigrationBanner'
import AuthChangeBanner from '@/components/Banners/AuthChangeBanner'
import FetchIndicator from '@/components/Layout/FetchIndicator'
import LayoutHeader from '@/components/Layout/LayoutHeader'
import BackToTopButton from '@/components/Layout/buttons/BackToTopButton'
import { UserContext } from '@/providers/UserProvider'
import { Layout } from 'antd'
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Middleware } from 'swr'
import { BareFetcher, SWRConfig } from 'swr'

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

  const { isAuthenticated } = useContext(UserContext)

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
        {isAuthenticated ? <AccountMigrationBanner /> : <AuthChangeBanner />}

        <LayoutHeader />
        <Layout className="p-4 bg-white dark:bg-gray-950">{children}</Layout>
        <div className="flex flex-col gap-4 fixed bottom-8 right-8 items-center">
          <FetchIndicator isLoading={showLoading} />
          <BackToTopButton />
        </div>
      </Layout>
    </SWRConfig>
  )
}

export default CustomLayout
