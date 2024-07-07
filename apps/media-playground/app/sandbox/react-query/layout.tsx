import DefaultLayout from '@/components/layout/default-layout'
import { PropsWithChildren } from 'react'

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <DefaultLayout>
      <div data-testid="content" className="flex-grow">
        {children}
      </div>
    </DefaultLayout>
  )
}

export default PageLayout
