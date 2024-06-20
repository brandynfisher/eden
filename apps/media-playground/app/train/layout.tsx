import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'
import { PropsWithChildren } from 'react'

const baseSegment = 'train'
const navItems: SecondaryNavSection[] = [
  {
    title: 'Public Models',
    links: [
      {
        label: 'Browse All',
        segments: [baseSegment, 'all'],
      },
      {
        label: 'Featured',
        segments: [baseSegment, 'featured'],
      },
      {
        label: 'Newest',
        segments: [baseSegment, 'newest'],
      },
    ],
  },
  {
    title: 'Your Models',
    links: [
      {
        label: 'Browse',
        segments: [baseSegment, 'all'],
      },
      {
        label: 'Publish',
        segments: [baseSegment, 'publish'],
      },
    ],
  },
]
const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <SecondaryNavLayout
      title={'Train'}
      baseSegment={baseSegment}
      navigation={navItems}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout
