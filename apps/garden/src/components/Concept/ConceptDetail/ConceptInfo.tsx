import ConceptDescription from '@/components/Concept/ConceptDetail/ConceptDescription'
import { BaseParamGroup } from '@/components/Creation/CreationDetail/CreationInfo'
import { UserContext } from '@/providers/UserProvider'
import { Concept } from '@edenlabs/eden-sdk'
import React, { useContext, useEffect, useState } from 'react'

const ConceptInfo = ({
  concept,
  onUpdate,
}: {
  concept: Concept
  onUpdate: (updatedConcept: Concept) => void
}) => {
  const [displayDateTime, setDisplayDateTime] = useState('')
  const { isAuthenticated, userId } = useContext(UserContext)
  const isAuthUser = isAuthenticated && concept?.user.userId === userId

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
      <div className="relative">
        <BaseParamGroup
          label={'Description'}
          value={
            <ConceptDescription
              concept={concept}
              editable={isAuthUser}
              onChange={onUpdate}
            />
          }
        />
      </div>

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
            <ol className="pl-3">
              {concept?.grid_prompts?.map((prompt, index) => (
              <li key={index} className="mb-2">{prompt ? prompt : 'n/a'}</li>
              ))}
            </ol>
          }
        />
      ) : null}
    </div>
  )
}

export default ConceptInfo
