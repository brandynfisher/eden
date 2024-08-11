'use client'

import { Card } from '@/components/ui/card'
import TypographyH6 from '@/components/ui/typography/TypographyH6'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  title: string
  description?: string
  image: string
  link: string
}

const GeneratorCard = ({ title, image, link, description }: Props) => {
  return (
    <Link href={link} className="group aspect-square" prefetch={false}>
      <Card className="relative min-h-64 flex flex-col justify-between overflow-hidden border-0 h-full w-full">
        {image.endsWith('mp4') ? (
          <video
            autoPlay={true}
            muted={true}
            loop={true}
            src={image}
            playsInline={true}
            className="absolute w-full h-full object-cover data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 dark:data-[loaded=false]:bg-gray-500/10"
            onLoadedMetadata={event => {
              event.currentTarget.setAttribute('data-loaded', 'true')
            }}
          />
        ) : (
          <Image
            src={image}
            alt={title}
            data-loaded="false"
            onLoad={event => {
              event.currentTarget.setAttribute('data-loaded', 'true')
            }}
            fill={true}
            sizes={'(max-width: 768px) 90vw, (max-width: 1280px) 25vw, 15vw'}
            className="object-cover data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 dark:data-[loaded=false]:bg-gray-500/10"
          />
        )}
        <div className="relative flex flex-col group bg-gradient-to-b from-popover to-50% hover:to-100% [@media(pointer:coarse)]:to-75% to-transparent flex-grow transition-all">
          <div className="px-3 py-2">
            <TypographyH6 className="opacity-75 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-all">
              {title}
            </TypographyH6>
            <div className="text-sm opacity-0 [@media(pointer:coarse)]:opacity-100 group-hover:opacity-100 transition-all">
              {description}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default GeneratorCard
