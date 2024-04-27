import { PropsWithChildren } from 'react'
import SecondaryNav from '@/components/navigation/secondary-nav'

const SecondaryNavLayout = ({children}: PropsWithChildren) => {
  return (
    <>
      <SecondaryNav />
      <main
        className='flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10'>
        {children}
      </main>
    </>
  )
}

export default SecondaryNavLayout