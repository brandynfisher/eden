import { PropsWithChildren } from 'react'
import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'

const PageLayout = ({ children }: PropsWithChildren) => {
  const baseSegments = ['create']

  const navItems: SecondaryNavSection[] = [
    {
      title: 'Recent',
      links: [
        // {
        //   label: 'Browse All',
        //   segments: [...baseSegments, '']
        // },
        // {
        //   label: 'Featured',
        //   segments: [...baseSegments, 'featured']
        // },
        // {
        //   label: 'Newest',
        //   segments: [...baseSegments, 'newest']
        // },
      ],
    },
    {
      title: 'Featured',
      links: [
        // {
        //   label: 'Browse All',
        //   segments: ['create', '']
        // },
        // {
        //   label: 'Featured',
        //   segments: ['artists', 'featured']
        // },
        // {
        //   label: 'Newest',
        //   segments: ['artists', 'newest']
        // },
      ],
    },
    {
      title: 'Popular',
      links: [
        // {
        //   label: 'Browse All',
        //   segments: ['create', '']
        // },
        // {
        //   label: 'Featured',
        //   segments: ['artists', 'featured']
        // },
        // {
        //   label: 'Newest',
        //   segments: ['artists', 'newest']
        // },
      ],
    },
    {
      title: 'Multi Media',
      links: [
        // {
        //   label: 'Browse All',
        //   segments: ['create', '']
        // },
        // {
        //   label: 'Featured',
        //   segments: ['artists', 'featured']
        // },
        // {
        //   label: 'Newest',
        //   segments: ['artists', 'newest']
        // },
      ],
    },
    {
      title: 'Video',
      links: [
        {
          label: 'img2vid',
          segments: [...baseSegments, 'video', 'img2vid'],
        },
        {
          label: 'vid2vid',
          segments: [...baseSegments, 'video', 'vid2vid'],
        },
      ],
    },
    {
      title: 'Image',
      links: [
        {
          label: 'txt2img',
          segments: [...baseSegments, 'image', 'txt2img'],
        },
        {
          label: 'img2img',
          segments: [...baseSegments, 'image', 'img2img'],
        },
      ],
    },
  ]

  return (
    <SecondaryNavLayout title={'Workflows'} baseSegments={baseSegments} navigation={navItems}>
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout