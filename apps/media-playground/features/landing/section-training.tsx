'use client'

import TrainingFeatureCard from './training-feature-card'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { cn } from '@/lib/utils'
import { Building2Icon, PaletteIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'

const ASSET_BASE_URL = 'https://d14i3advvh2bvd.cloudfront.net/app/landing/home'

interface TrainingFeatureConfig {
  id: string
  icon: {
    color: string
    component: typeof UsersIcon | typeof PaletteIcon | typeof Building2Icon
  }
  title: string
  subtitle: string
  images: {
    input: {
      full: string
      thumb: string
    }
    output: {
      full: string
      thumb: string
    }
  }
  video?: string
}

const TRAINING_FEATURES: TrainingFeatureConfig[] = [
  {
    id: 'characters',
    icon: {
      color: 'purple',
      component: UsersIcon,
    },
    title: 'Your Characters',
    subtitle: 'Create models that bring your characters to life',
    images: {
      input: {
        full: `${ASSET_BASE_URL}/banny_train_v2.jpg`,
        thumb: `${ASSET_BASE_URL}/banny_train_thumb_v2.jpg`,
      },
      output: {
        full: `${ASSET_BASE_URL}/banny_v1.jpg`,
        thumb: `${ASSET_BASE_URL}/banny_thumb_v1.jpg`,
      },
    },
    video: `${ASSET_BASE_URL}/banny_animation_v1.mp4`,
  },
  {
    id: 'style',
    icon: {
      color: 'blue',
      component: PaletteIcon,
    },
    title: 'Your Style',
    subtitle:
      'Train models that understand and replicate your unique artistic style',
    images: {
      input: {
        full: `${ASSET_BASE_URL}/ygor_train_v2.jpg`,
        thumb: `${ASSET_BASE_URL}/ygor_train_thumb_v2.jpg`,
      },
      output: {
        full: `${ASSET_BASE_URL}/ygor_v1.jpg`,
        thumb: `${ASSET_BASE_URL}/ygor_thumb_v1.jpg`,
      },
    },
    video: `${ASSET_BASE_URL}/ygor_animation_v1.mp4`,
  },
  {
    id: 'brand',
    icon: {
      color: 'green',
      component: Building2Icon,
    },
    title: 'Your Brand',
    subtitle:
      'Create consistent brand assets with AI that knows your guidelines',
    images: {
      input: {
        full: `${ASSET_BASE_URL}/xander_train_v2.jpg`,
        thumb: `${ASSET_BASE_URL}/xander_train_thumb_v2.jpg`,
      },
      output: {
        full: `${ASSET_BASE_URL}/xander_v1.jpg`,
        thumb: `${ASSET_BASE_URL}/xander_thumb_v1.jpg`,
      },
    },
    video: `${ASSET_BASE_URL}/xander_animation_v1.mp4`,
  },
]

function getIconColorClasses(color: string) {
  const colors = {
    purple: {
      bg: 'bg-purple-600/20',
      text: 'text-purple-600',
    },
    blue: {
      bg: 'bg-blue-600/20',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-600/20',
      text: 'text-green-600',
    },
  } as const

  return colors[color as keyof typeof colors]
}

export default function SectionTraining() {
  return (
    <div className="max-w-5xl mx-auto">
      <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
        Give Your Agent a Unique Visual Style
      </TypographyH4>
      <p className="text-center text-muted-foreground mb-6">
        Personalize your agent by training a custom model on your own aesthetic,
        character, or brand assets.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {TRAINING_FEATURES.map(feature => {
          const colorClasses = getIconColorClasses(feature.icon.color)
          return (
            <TrainingFeatureCard
              key={feature.id}
              icon={
                <div className={cn(colorClasses.bg, 'p-2 rounded-full')}>
                  <feature.icon.component
                    className={cn('h-6 w-6', colorClasses.text)}
                  />
                </div>
              }
              title={feature.title}
              subtitle={feature.subtitle}
              inputImage={feature.images.input.full}
              inputImageThumbnail={feature.images.input.thumb}
              outputImage={feature.images.output.full}
              outputImageThumbnail={feature.images.output.thumb}
              video={feature.video}
            />
          )
        })}
      </div>
      <p className="text-center text-muted-foreground mt-6 px-4">
        Every artist or brand has their own unique style—that's why
        personalization is at the core of what we do.
        <br />
        Don't just use our models—
        <Link
          href="/train"
          className="text-purple-500 font-bold hover:text-purple-400"
        >
          train your own!
        </Link>
      </p>
    </div>
  )
}
