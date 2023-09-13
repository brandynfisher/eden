import ConceptReactions from '@/components/Concept/ConceptReactions'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

export interface ConceptCardHoverOverlayProps {
  concept: Concept
  handlers: {
    onChange: (updatedConcept: Concept) => void
  }
}

const ConceptCardOverlay = ({
  concept,
  handlers,
}: ConceptCardHoverOverlayProps) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between">
      <div className="mx-2 mt-2 anim-slide-fade-down">
        <ConceptReactions concept={concept} onChange={handlers.onChange} />
      </div>
    </div>
  )
}

export default ConceptCardOverlay
