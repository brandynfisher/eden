'use client'

import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import { ArrowBigDownDashIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface TrainingFeatureCardProps {
  icon?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  inputImage?: string
  inputImageThumbnail?: string
  outputImage?: string
  outputImageThumbnail?: string
}

export default function TrainingFeatureCard({
  icon,
  title,
  subtitle,
  inputImage,
  inputImageThumbnail,
  outputImage,
  outputImageThumbnail,
}: TrainingFeatureCardProps) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-card">
      {icon && <div className="mb-2">{icon}</div>}
      {title && <h3 className="font-semibold mb-4">{title}</h3>}
      <div className="text-sm text-muted-foreground text-center flex flex-col items-center">
        <LightboxGallery>
          {inputImage && (
            <LightboxTrigger
              className="hover:brightness-105 cursor-zoom-in"
              slide={{
                url: inputImage,
                thumbnail: inputImageThumbnail,
                description: 'Images used as dataset for training',
              }}
              startIndex={0}
              imageProps={{
                loading: 'lazy',
                unoptimized: true,
                className: 'relative rounded-lg',
              }}
            />
          )}
          <ArrowBigDownDashIcon className="h-9 w-9 my-2" />
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
                loading: 'lazy',
                unoptimized: true,
                className: 'relative rounded-lg',
              }}
            />
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
