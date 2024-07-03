import DefaultLayout from '@/components/layout/default-layout'
import { ReactQueryProvider } from '@/provider/react-query-provider'
import { PropsWithChildren } from 'react'

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <DefaultLayout>
      <ReactQueryProvider>
        <div data-testid="content" className="flex-grow">
          {children}
        </div>
      </ReactQueryProvider>
    </DefaultLayout>
  )
}

export default PageLayout
