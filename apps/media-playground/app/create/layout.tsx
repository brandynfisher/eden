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
  {
    title: 'Model',
    links: [
      {
        label: 'LoRA Trainer',
        segments: [baseSegment, 'model', 'lora_trainer'],
      },
    ],
  },
  {
    title: 'Video',
    links: [
      {
        label: 'Text to Video',
        segments: [baseSegment, 'video', 'txt2vid'],
      },
      {
        label: 'Text to Video (LoRA)',
        segments: [baseSegment, 'video', 'txt2vid_lora'],
      },
      {
        label: 'Animate 3D',
        segments: [baseSegment, 'video', 'animate_3D'],
      },
      {
        label: 'Image to Video',
        segments: [baseSegment, 'video', 'img2vid'],
      },
      // {
      //   label: 'Image to Video (MuseV)',
      //   segments: [baseSegment, 'video', 'img2vid_museV'],
      // },
      {
        label: 'Video to Video (SD1.5)',
        segments: [baseSegment, 'video', 'vid2vid_sd15'],
      },
      {
        label: 'Video to Video (SDXL)',
        segments: [baseSegment, 'video', 'vid2vid_sdxl'],
      },
      {
        label: 'Style Mixing',
        segments: [baseSegment, 'video', 'style_mixing'],
      },
      {
        label: 'Video Upscaler',
        segments: [baseSegment, 'video', 'video_upscaler'],
      },
      // {
      //   label: 'Image to Video',
      //   segments: [baseSegment, 'video', 'img2vid'],
      // },
      // {
      //   label: 'Video to Video',
      //   segments: [baseSegment, 'video', 'vid2vid'],
      // },
    ],
  },
  {
    title: 'Image',
    links: [
      {
        label: 'Text to Image',
        segments: [baseSegment, 'image', 'txt2img'],
      },
      {
        label: 'Text to Image (SD3)',
        segments: [baseSegment, 'image', 'SD3'],
      },
      {
        label: 'Face Styler',
        segments: [baseSegment, 'image', 'face_styler'],
      },
      {
        label: 'Inpaint',
        segments: [baseSegment, 'image', 'inpaint'],
      },
      {
        label: 'Background Removal',
        segments: [baseSegment, 'image', 'background_removal'],
      },
      {
        label: 'Image Upscaler',
        segments: [baseSegment, 'image', 'clarity_upscaler'],
      },
      {
        label: 'Moodmix',
        segments: [baseSegment, 'image', 'moodmix'],
      },
    ],
  },
  {
    title: 'Story',
    links: [
      {
        label: 'Reel',
        segments: [baseSegment, 'story', 'reel'],
      },
    ],
  },
  {
    title: 'Audio',
    links: [
      {
        label: 'Audiocraft',
        segments: [baseSegment, 'audio', 'audiocraft'],
      },
    ],
  },
]

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <SecondaryNavLayout
      title={'Workflows'}
      baseSegment={baseSegment}
      navigation={navItems}
      wrapClassName={'!pb-0'}
    >
      {children}
    </SecondaryNavLayout>
  )
}

export default PageLayout
