import CreationCardDetail from '@/components/Creation/CreationCard/CreationCardDetail'
import CreationReactions from '@/components/Creation/CreationReactions'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

export interface CreationCardHoverOverlayProps {
  creation: Creation
  handlers: {
    onChange: (updatedCreation: Creation) => void
  }
}

const CreationCardHoverOverlay = ({
  creation,
  handlers,
}: CreationCardHoverOverlayProps) => {
  return (
    <div className="absolute z-10 inset-0 flex flex-col justify-between pointer-events-none">
      <div className="mx-2 mt-2 anim-slide-fade-down">
        <CreationReactions creation={creation} onChange={handlers.onChange} />
      </div>
      <div className="mx-2 mb-2 anim-slide-fade-up">
        <CreationCardDetail creation={creation} />
      </div>
    </div>
  )
}

export default CreationCardHoverOverlay
