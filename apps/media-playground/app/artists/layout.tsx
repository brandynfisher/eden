import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'
import { PropsWithChildren } from 'react'

const PageLayout = ({ children }: PropsWithChildren) => {
  const baseSegment = 'artists'

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

  return (
    <SecondaryNavLayout
      title={'Artists'}
      baseSegment={baseSegment}
      navigation={navItems}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout
