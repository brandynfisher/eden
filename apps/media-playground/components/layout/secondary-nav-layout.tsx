import SecondaryNav from '@/components/navigation/secondary-nav'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  title?: string
  baseSegment: string
  navigation: SecondaryNavSection[]
}

const SecondaryNavLayout = ({
  children,
  title,
  navigation,
  baseSegment,
}: Props) => {
  return (
    <div className="md:flex min-h-[calc(100vh_-_theme(spacing.16))] bg-muted/40">
      <SecondaryNav
        title={title}
        baseSegment={baseSegment}
        items={navigation}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        {children}
      </main>
    </div>
  )
}

export default SecondaryNavLayout
