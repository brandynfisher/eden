import MediaDisplay from '@/components/MediaDisplay'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

const ConceptMedia = ({ concept }: { concept: Concept }) => {
  if (!concept || !concept.thumbnail) {
    return null
  }

  return (
    <MediaDisplay
      priority={true}
      aspectRatio={100}
      className={'media-display__main'}
      creationUri={concept?.thumbnail}
      previewUri={concept?.thumbnail}
    />
  )
}

export default ConceptMedia
