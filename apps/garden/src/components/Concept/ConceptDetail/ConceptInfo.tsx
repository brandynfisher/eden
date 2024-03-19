import { BaseParamGroup } from '@/components/Creation/CreationDetail/CreationInfo'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
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
    <div className="flex flex-col gap-2">
      {concept?.description ? (
        <BaseParamGroup
          label={'Description'}
          value={
            <TruncatedExpandableText text={concept.description} lines={3} />
          }
        />
      ) : null}

      <div className="flex gap-4 flex-wrap">
        {/*<BaseParamGroup label="Type" value={<div>concept</div>} />*/}
        <BaseParamGroup label="Checkpoint" value={concept.checkpoint} />
        <BaseParamGroup
          label={'Training Images'}
          value={
            concept.num_training_images
              ? concept.num_training_images
              : concept.training_images?.length || 0
          }
        />
        <BaseParamGroup label="Date" value={displayDateTime} />
      </div>

      {concept?.grid_prompts && concept.grid_prompts?.length ? (
        <BaseParamGroup
          label={'Grid Prompts'}
          value={
            <ol className="pl-3" type="a">
              {concept?.grid_prompts?.map((prompt, index) => (
                <div key={index}>{prompt}</div>
              ))}
            </ol>
          }
        />
      ) : null}
    </div>
  )
}

export default ConceptInfo
