import SecondaryNav from '@/components/navigation/secondary-nav'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'
import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  title?: string
  baseSegment: string
  navigation: SecondaryNavSection[]
  wrapClassName?: string
}

const SecondaryNavLayout = ({
  children,
  title,
  navigation,
  baseSegment,
  wrapClassName,
}: Props) => {
  return (
    <div className="md:flex min-h-[calc(100vh_-_theme(spacing.16))] bg-muted/40">
      <SecondaryNav
        title={title}
        baseSegment={baseSegment}
        items={navigation}
      />
      <main
        className={cn([
          'flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10',
          wrapClassName,
        ])}
      >
        {children}
      </main>
    </div>
  )
}

export default SecondaryNavLayout
