'use client'

import VideoResult from '@/components/media/video-result'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import Link from 'next/link'

export default function SectionEve() {
  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4">
      <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
        Build Creative Agents
      </TypographyH4>
      <div className="text-center text-muted-foreground">
        Eden Agents are chat agents who are given a unique personality, set of
        tools & instructions and a custom visual model. <br />
        They can be crafted to act as creative assistants, coaches,
        storytellers, brand ambassadors and more.{' '}
        <Link
          href="/agents"
          className=" text-purple-500 font-bold inline-flex items-center hover:text-purple-400"
        >
          Get started here!
        </Link>
        <div className="relative flex justify-center items-center max-w-full mx-auto mt-6">
          <VideoResult
            videoUrl="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/trailer_v12_crf17.mp4"
            posterUrl="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/PRODUCT_TRAILER-4_poster.webp"
            width={2048}
            height={1153}
            className="rounded-lg "
            autoPlay={false}
            muted={false}
            loop={false}
            controls={true}
          />
        </div>
      </div>
    </div>
  )
}
