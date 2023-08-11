import ConceptCardDetail from '@/components/Concept/ConceptCard/ConceptCardDetail'
import ConceptReactions from '@/components/Concept/ConceptReactions'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

export interface ConceptCardHoverOverlayProps {
  concept: Concept
  handlers: {
    onChange: (updatedConcept: Concept) => void
    openDetailModal: () => void
  }
}

const ConceptCardHoverOverlay = ({
  concept,
  handlers,
}: ConceptCardHoverOverlayProps) => {
  const handleClickOutside = (event: React.MouseEvent) => {
    // Check if the click event target is not a button
    const targetElement = event.target as Element
    if (!targetElement.closest('button')) {
      handlers.openDetailModal()
    }
  }

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between"
      onClick={handleClickOutside}
    >
      <div className="mx-2 mt-2 anim-slide-fade-down">
        <ConceptReactions concept={concept} onChange={handlers.onChange} />
      </div>
      <div className="mx-2 mb-2 anim-slide-fade-up">
        <ConceptCardDetail concept={concept} isOverlay={true} />
      </div>
    </div>
  )
}

export default ConceptCardHoverOverlay
