import CreationCardCreator from '@/components/CreationCard/CreationCardCreator'
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
      <div className="mx-4 mt-4">
        <CreationReactions creation={creation} onChange={handlers.onChange} />
      </div>
      <div className="mx-4 mb-4">
        {/*//@ts-ignore @todo: fix response type */}
        <CreationCardCreator creatorId={creation.user.userId} />
      </div>
    </div>
  )
}

export default CreationCardHoverOverlay
