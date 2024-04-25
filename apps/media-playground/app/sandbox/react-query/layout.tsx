import { ReactQueryProvider } from '@/components/provider/react-query-provider'
import { PropsWithChildren } from 'react'

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <ReactQueryProvider>
      <div data-testid="content" className="flex-grow">
        {children}
      </div>
    </ReactQueryProvider>
  )
}

export default PageLayout