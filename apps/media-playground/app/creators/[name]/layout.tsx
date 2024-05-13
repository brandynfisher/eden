import { PropsWithChildren } from 'react'
import DefaultLayout from '@/components/layout/default-layout'

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <DefaultLayout>
      {children}
      <div className='flex gap-6'>
        <div>Models</div>
        <div>Creations</div>
        <div>Collections</div>
      </div>
    </DefaultLayout>
  )
}

export default PageLayout