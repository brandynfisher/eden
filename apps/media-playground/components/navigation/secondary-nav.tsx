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
    <div className="bg-muted/60 w-50 flex flex-col items-start">
      <div className="xl:sticky xl:top-16 w-full">
        {title ? (
          <Link href={`/${baseSegment}`}>
            <TypographyH4 className="p-4 text-accent-foreground">
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
