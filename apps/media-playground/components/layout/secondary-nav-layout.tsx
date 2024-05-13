import { PropsWithChildren } from 'react'
import SecondaryNav from '@/components/navigation/secondary-nav'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'

type Props = PropsWithChildren & {
  title?: string
  baseSegments?: string[]
  navigation: SecondaryNavSection[]
}

const SecondaryNavLayout = ({children, title, navigation, baseSegments}: Props) => {
  return (
    <div className="md:flex min-h-[calc(100vh_-_theme(spacing.16))] bg-muted/40">
      <SecondaryNav title={title} baseSegments={baseSegments} items={navigation} />
      <main
        className='flex flex-1 flex-col gap-4 md:gap-8 md:p-10'>
        {children}
      </main>
    </div>
  )
}

export default SecondaryNavLayout