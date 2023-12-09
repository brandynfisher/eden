import { PraiseButton } from '@/components/Card/CardReactions'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import React, { Dispatch, SetStateAction } from 'react'

export interface ConceptReactionsProps {
  concept: Concept
  onChange: (updatedConcept: Concept) => void
  showCounts?: boolean
}

const ConceptReactions = ({
  concept,
  onChange,
  showCounts,
}: ConceptReactionsProps) => {
  return (
    <div className="relative flex justify-between">
      <div>
        <div className="flex pointer-events-auto">
          <PraiseButton
            item={concept}
            itemType={'concept'}
            onChange={onChange as Dispatch<SetStateAction<Creation | Concept>>}
            showCounts={showCounts}
          />
        </div>
      </div>
    </div>
  )
}

export default ConceptReactions
