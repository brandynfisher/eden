import SecondaryNav from '@/components/navigation/secondary-nav'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'

const navItems: SecondaryNavSection[] = [
  {
    title: 'Artists',
    links: [
      {
        label: 'Browse All',
        segments: ['artists']
      },
      {
        label: 'Featured',
        segments: ['artists', 'featured']
      },
      {
        label: 'Newest',
        segments: ['artists', 'newest']
      },
    ]
  }
]

const PageNavigation = () => {
  return (
    <SecondaryNav items={navItems}/>
  )
}

export default PageNavigation
