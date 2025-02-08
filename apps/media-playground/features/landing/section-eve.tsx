'use client'

import VideoResult from '@/components/media/video-result'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import Link from 'next/link'

export default function SectionEve() {
  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4">
      <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
        The Best Creative AI Tools, All in One Place
      </TypographyH4>
      <div className="text-center text-muted-foreground">
        Our AI agents have mastered every tool in our creative tool suite, so
        you don't have to. Just share your vision, and let AI handle the rest.{' '}
        <Link
          href="/create"
          className=" text-purple-500 font-bold inline-flex items-center hover:text-purple-400"
        >
          Get started for free!
        </Link>
        <div className="relative flex justify-center items-center max-w-full mx-auto mt-6">
          <VideoResult
            videoUrl="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/PRODUCT_TRAILER-4.mp4"
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
