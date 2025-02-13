'use client'

import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import VideoResult from '@/components/media/video-result'
import { ChevronsDownIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface TrainingFeatureCardProps {
  icon: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  inputImage?: string
  inputImageThumbnail?: string
  outputImage?: string
  outputImageThumbnail?: string
  video?: string
}

export default function TrainingFeatureCard({
  icon,
  title,
  subtitle,
  inputImage,
  inputImageThumbnail,
  outputImage,
  outputImageThumbnail,
  video,
}: TrainingFeatureCardProps) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-muted-darker/80">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        {title && <h3 className="font-semibold">{title}</h3>}
      </div>
      <div className="text-sm text-muted-foreground text-center flex flex-col items-center">
        <LightboxGallery>
          {inputImage && (
            <>
              <div className="flex items-center gap-2 justify-center mb-3 text-muted-foreground/60">
                <ChevronsDownIcon className="h-5" />
                <div>Train</div>
                <ChevronsDownIcon className="h-5" />
              </div>
              <LightboxTrigger
                className="hover:brightness-105 cursor-zoom-in"
                slide={{
                  url: inputImage,
                  thumbnail: inputImageThumbnail,
                  description: 'Images used as dataset for training',
                }}
                startIndex={0}
                imageProps={{
                  customLoader: false,
                  loading: 'lazy',
                  unoptimized: true,
                  className: 'relative rounded-lg object-cover',
                }}
              />
              <div className="flex items-center gap-2 justify-center my-3 text-muted-foreground/60">
                <ChevronsDownIcon className="h-5" />
                <div>Generate</div>
                <ChevronsDownIcon className="h-5" />
              </div>
            </>
          )}
          {outputImage && (
            <LightboxTrigger
              className="hover:brightness-105 cursor-zoom-in"
              slide={{
                url: outputImage,
                thumbnail: outputImageThumbnail,
                description: 'Images generated using the trained model',
              }}
              startIndex={1}
              imageProps={{
                customLoader: false,
                loading: 'lazy',
                unoptimized: true,
                className: 'relative rounded-lg object-cover',
              }}
            />
          )}
          {video && (
            <>
              <div className="flex items-center gap-2 justify-center my-3 text-muted-foreground/60">
                <ChevronsDownIcon className="h-5" />
                <div>Animate</div>
                <ChevronsDownIcon className="h-5" />
              </div>
              <VideoResult
                videoUrl={video}
                className="relative rounded-lg object-cover w-full"
                controls={true}
                muted={false}
                loop={true}
                autoPlay={false}
                preload="metadata"
              />
            </>
          )}
        </LightboxGallery>
        {subtitle && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
