import { PropsWithChildren } from 'react'
import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'

const PageLayout = ({ children }: PropsWithChildren) => {
  const baseSegments = ['train']

  const navItems: SecondaryNavSection[] = [
    {
      title: 'Public Models',
      links: [
        {
          label: 'Browse All',
          segments: [...baseSegments, 'all'],
        },
        {
          label: 'Featured',
          segments: [...baseSegments, 'featured'],
        },
        {
          label: 'Newest',
          segments: [...baseSegments, 'newest'],
        },
      ],
    },
    {
      title: 'Your Models',
      links: [
        {
          label: 'Browse',
          segments: [...baseSegments, 'all'],
        },
        {
          label: 'Publish',
          segments: [...baseSegments, 'publish'],
        },
      ],
    },
  ]

  return (
    <SecondaryNavLayout title={'Train'} baseSegments={baseSegments} navigation={navItems}>
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout