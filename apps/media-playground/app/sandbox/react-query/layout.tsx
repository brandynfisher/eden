import { ReactQueryProvider } from '@/components/provider/react-query-provider'
import { PropsWithChildren } from 'react'
import DefaultLayout from '@/components/layout/default-layout'

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <DefaultLayout>
      <ReactQueryProvider>
        <div data-testid='content' className='flex-grow'>
          {children}
        </div>
      </ReactQueryProvider>
    </DefaultLayout>
  )
}

export default PageLayout