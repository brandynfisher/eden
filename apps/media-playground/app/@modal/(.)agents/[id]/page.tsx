'use client'

import ArrowNavigation from '@/components/modal/arrow-navigation'
import FullScreenModal from '@/components/modal/full-screen-modal'
import AgentDetail from '@/features/detail/agent-detail'
import { useState } from 'react'

type Props = {
  params: { id: string }
}

export default function AgentsModalPage({ params: { id } }: Props) {
  const [currentId, setCurrentId] = useState(id)

  return (
    <>
      <FullScreenModal
        className="p-0 relative"
        components={{
          OverlayComponent: () => (
            <ArrowNavigation basePath="/agents" onIdChange={setCurrentId} />
          ),
        }}
      >
        <AgentDetail id={currentId} />
      </FullScreenModal>
    </>
  )
}
