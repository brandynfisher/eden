'use client'

import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import Link from 'next/link'

export default function SectionAgents() {
  return (
    <div className="max-w-4xl mx-auto">
      <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
        Create Custom AI Agents
      </TypographyH4>
      <p className="text-center text-muted-foreground mb-4">
        Eden Agents are chat agents who are given a unique personality, set of
        tools & instructions and a custom visual model.
      </p>
      <p className="text-center text-muted-foreground">
        They can be crafted to act as creative assistants, coaches,
        storytellers, brand ambassadors and more. <br />
        <Link
          href="/explore?tab=agents&create=true"
          className="group text-purple-500 font-bold inline-flex items-center hover:text-purple-400"
        >
          Build your first agent right now!
        </Link>
      </p>
      <LightboxGallery>
        <LightboxTrigger
          className="hover:brightness-105 cursor-zoom-in"
          slide={{
            url: 'https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_chat_v1.jpg',
            thumbnail:
              'https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_chat_v1.jpg',
          }}
          startIndex={0}
          imageProps={{
            loading: 'lazy',
            unoptimized: true,
            className:
              'rounded-lg mt-6 max-w-lg mx-auto w-full border border-secondary',
          }}
        />
      </LightboxGallery>
    </div>
  )
}
