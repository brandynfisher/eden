'use client'

import TrainingFeatureCard from './training-feature-card'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { BrainCircuitIcon, PaletteIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'

export default function SectionTraining() {
  return (
    <div className="max-w-5xl mx-auto">
      <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
        Train Custom Models That Learn:
      </TypographyH4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mx-4">
        <TrainingFeatureCard
          icon={<UsersIcon className="h-8 w-8 text-purple-600" />}
          title="Your Characters"
          inputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_train_thumb_v1.jpg"
          inputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_train_v1.jpg"
          outputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_thumb_v1.jpg"
          outputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_v1.jpg"
          subtitle="Create models that bring your characters to life"
        />

        <TrainingFeatureCard
          icon={<PaletteIcon className="h-8 w-8 text-purple-600" />}
          title="Your Style"
          inputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/does_train_thumb_v1.jpg"
          inputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/does_train_v1.jpg"
          outputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/does_thumb_v1.jpg"
          outputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/does_v1.jpg"
          subtitle="Train models that understand and replicate your unique artistic style"
        />

        <TrainingFeatureCard
          icon={<BrainCircuitIcon className="h-8 w-8 text-purple-600" />}
          title="Your Brand"
          inputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/xander_train_thumb_v1.jpg"
          inputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/xander_train_v1.jpg"
          outputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/xander_thumb_v1.jpg"
          outputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/xander_v1.jpg"
          subtitle="Create consistent brand assets with AI that knows your guidelines"
        />
      </div>
      <p className="text-center text-muted-foreground mt-6 px-4">
        Every artist or brand has their own unique style—that's why
        personalization is at the core of what we do.
        <br />
        Don't just use our models—
        <Link href="/train" className="text-purple-600 font-bold">
          train your own!
        </Link>
      </p>
    </div>
  )
}
