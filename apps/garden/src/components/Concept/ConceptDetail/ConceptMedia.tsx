import MediaDisplay from '@/components/MediaDisplay'
import { CONFIG } from '@/lib/config'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

const ConceptMedia = ({ concept }: { concept: Concept }) => {
  return (
    <MediaDisplay
      priority={true}
      aspectRatio={100}
      className={'media-display__main'}
      creationUri={
        concept?.thumbnail
          ? concept?.thumbnail
          : `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
      }
      previewUri={concept?.thumbnail}
    />
  )
}

export default ConceptMedia
