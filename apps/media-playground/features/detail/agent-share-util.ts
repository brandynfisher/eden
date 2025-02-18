import { updateShareModal } from '@/stores/dialogs/dialogs.slice'
import type { AppDispatch } from '@/stores/store'
import { Agent } from '@edenlabs/eden-sdk'
import React from 'react'

export const handleShareClick = (
  evt: React.MouseEvent<HTMLButtonElement>,
  agent: Agent,
  dispatch: AppDispatch,
) => {
  evt.preventDefault()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/agents/${agent.username}`
  dispatch(
    updateShareModal({
      isOpen: true,
      shareUrl: shareUrl,
    }),
  )
}
