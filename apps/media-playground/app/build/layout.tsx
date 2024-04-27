import { PropsWithChildren } from 'react'
import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <SecondaryNavLayout>
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout