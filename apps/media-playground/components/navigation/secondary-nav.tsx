import TypographyH4 from '@/components/ui/typography/TypographyH4'
import SecondaryNavLinks, { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'

type Props = {
  title?: string
  baseSegments?: string[]
  items: SecondaryNavSection[]
}
const SecondaryNav = ({title, baseSegments, items}: Props) => {
  return (
    <div className="bg-muted/60 p-4">
      { title ? <TypographyH4 className="mb-6">{title}</TypographyH4> : undefined}
      <SecondaryNavLinks baseSegments={baseSegments} items={items}/>
    </div>
  )
}

export default SecondaryNav