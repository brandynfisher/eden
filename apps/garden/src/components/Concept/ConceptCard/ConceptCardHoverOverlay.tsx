import ConceptCardDetail from '@/components/Concept/ConceptCard/ConceptCardDetail'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

export interface ConceptCardHoverOverlayProps {
  concept: Concept
}

const ConceptCardHoverOverlay = ({ concept }: ConceptCardHoverOverlayProps) => {
  return (
    <div>
      {/*<div className="mx-2 mt-2 anim-slide-fade-down">*/}
      {/*  <ConceptReactions concept={concept} onChange={handlers.onChange} />*/}
      {/*</div>*/}
      <ConceptCardDetail concept={concept} isOverlay={true} />
    </div>
  )
}

export default ConceptCardHoverOverlay
