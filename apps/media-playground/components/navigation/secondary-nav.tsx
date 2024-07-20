import SecondaryNavLinks, {
  SecondaryNavSection,
} from '@/components/navigation/secondary-nav-links'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import Link from 'next/link'

type Props = {
  title?: string
  baseSegment: string
  items: SecondaryNavSection[]
}
const SecondaryNav = ({ title, baseSegment, items }: Props) => {
  return (
    <div className="bg-muted/60 p-4 min-w-48 flex flex-col items-start">
      <div className="sticky top-20">
        {title ? (
          <Link href={`/${baseSegment}`}>
            <TypographyH4 className="mb-6 text-accent-foreground">
              {title}
            </TypographyH4>
          </Link>
        ) : undefined}
        <SecondaryNavLinks baseSegment={baseSegment} items={items} />
      </div>
    </div>
  )
}

export default SecondaryNav
