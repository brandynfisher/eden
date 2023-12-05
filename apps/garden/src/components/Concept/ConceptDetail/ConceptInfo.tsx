import { BaseParamGroup } from '@/components/Creation/CreationDetail/CreationInfo'
import { Concept } from '@edenlabs/eden-sdk'
import React, { useEffect, useState } from 'react'

const ConceptInfo = ({ concept }: { concept: Concept }) => {
  const [displayDateTime, setDisplayDateTime] = useState('')

  useEffect(() => {
    const createdDate = new Date(concept.createdAt)
    const dateString = createdDate.toLocaleDateString()
    const timeString = createdDate.toLocaleTimeString()
    const timeStringFormatted = timeString.substring(
      0,
      timeString.lastIndexOf(':'),
    )
    setDisplayDateTime(`${dateString} ${timeStringFormatted}`)
  }, [concept.createdAt])

  return (
    <div className="flex gap-4 flex-wrap justify-between">
      <BaseParamGroup label="Type" value={<div>concept</div>} />
      <BaseParamGroup label="Checkpoint" value={concept.checkpoint} />
      <BaseParamGroup label="Date" value={displayDateTime} />
      <BaseParamGroup
        label={'Training Images'}
        value={
          concept.num_training_images
            ? concept.num_training_images
            : concept.training_images?.length || 0
        }
      />
    </div>
  )
}

export default ConceptInfo
