import CreationCardDetail from '@/components/CreationCard/CreationCardDetail'
import CreationReactions from '@/components/CreationReactions'
import { Creation } from '@eden-labs/eden-sdk'
import React from 'react'

export interface CreationCardHoverOverlayProps {
  creation: Creation
  handlers: {
    onChange: (updatedCreation: Creation) => void
    openDetailModal: () => void
  }
}

const CreationCardHoverOverlay = ({
  creation,
  handlers,
}: CreationCardHoverOverlayProps) => {
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
        <CreationReactions creation={creation} onChange={handlers.onChange} />
      </div>
      <div className="mx-2 mb-2 anim-slide-fade-up">
        <CreationCardDetail creation={creation} />
      </div>
    </div>
  )
}

export default CreationCardHoverOverlay
