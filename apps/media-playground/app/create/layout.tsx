import SecondaryNavLayout from '@/components/layout/secondary-nav-layout'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'
import { PropsWithChildren } from 'react'

const baseSegment = 'create'

const navItems: SecondaryNavSection[] = [
  // {
  //   title: 'Recent',
  //   links: [
  //     // {
  //     //   label: 'Browse All',
  //     //   segments: [baseSegment, '']
  //     // },
  //     // {
  //     //   label: 'Featured',
  //     //   segments: [baseSegment, 'featured']
  //     // },
  //     // {
  //     //   label: 'Newest',
  //     //   segments: [baseSegment, 'newest']
  //     // },
  //   ],
  // },
  // {
  //   title: 'Featured',
  //   links: [
  //     // {
  //     //   label: 'Browse All',
  //     //   segments: ['create', '']
  //     // },
  //     // {
  //     //   label: 'Featured',
  //     //   segments: ['artists', 'featured']
  //     // },
  //     // {
  //     //   label: 'Newest',
  //     //   segments: ['artists', 'newest']
  //     // },
  //   ],
  // },
  // {
  //   title: 'Popular',
  //   links: [
  //     // {
  //     //   label: 'Browse All',
  //     //   segments: ['create', '']
  //     // },
  //     // {
  //     //   label: 'Featured',
  //     //   segments: ['artists', 'featured']
  //     // },
  //     // {
  //     //   label: 'Newest',
  //     //   segments: ['artists', 'newest']
  //     // },
  //   ],
  // },
  // {
  //   title: 'Multi Media',
  //   links: [
  //     // {
  //     //   label: 'Browse All',
  //     //   segments: ['create', '']
  //     // },
  //     // {
  //     //   label: 'Featured',
  //     //   segments: ['artists', 'featured']
  //     // },
  //     // {
  //     //   label: 'Newest',
  //     //   segments: ['artists', 'newest']
  //     // },
  //   ],
  // },
  // {
  //   title: 'Video',
  //   links: [
  //     {
  //       label: 'Text to Video',
  //       segments: [baseSegment, 'video', 'txt2vid'],
  //     },
  //     {
  //       label: 'Image to Video',
  //       segments: [baseSegment, 'video', 'img2vid'],
  //     },
  //     {
  //       label: 'Video to Video',
  //       segments: [baseSegment, 'video', 'vid2vid'],
  //     },
  //   ],
  // },
  {
    title: 'Image',
    links: [
      {
        label: 'Text to Image',
        segments: [baseSegment, 'image', 'txt2img'],
      },
      {
        label: 'In-painting',
        segments: [baseSegment, 'image', 'inpaint'],
      },
      // {
      //   label: 'Image to Image',
      //   segments: [baseSegment, 'image', 'img2img'],
      // },
    ],
  },
]

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <SecondaryNavLayout
      title={'Workflows'}
      baseSegment={baseSegment}
      navigation={navItems}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout
