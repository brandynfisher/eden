'use client'

import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { PlayIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function SectionEve() {
  return (
    <div className="max-w-3xl mx-auto">
      <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
        The Best Creative AI Tools, All in One Place
      </TypographyH4>
      <div className="text-center text-muted-foreground">
        Our AI agents have mastered every tool in our creative tool suite, so
        you don't have to. Just share your vision, and let AI handle the rest.{' '}
        <Link
          href="/create"
          className=" text-purple-600 font-bold inline-flex items-center hover:text-purple-400"
        >
          Get started for free!
        </Link>
        <div className="relative flex justify-center items-center max-w-lg mx-auto mt-6">
          <Image
            src="/temp/eve_splash.png"
            alt="eve_splash"
            width={2048}
            height={2048}
            className="rounded-lg"
          />
          <div className="absolute flex justify-center items-center bg-accent/60 rounded-full p-2">
            <PlayIcon className="h-8 w-8 " />
          </div>
        </div>
      </div>
    </div>
  )
}
