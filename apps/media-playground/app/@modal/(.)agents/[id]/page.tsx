'use client'

import ArrowNavigation from '@/components/modal/arrow-navigation'
import FullScreenModal from '@/components/modal/full-screen-modal'
import AgentDetail from '@/features/detail/agent-detail'
import { useRef, useState } from 'react'

type Props = {
  params: { id: string }
}

export default function AgentsModalPage({ params: { id } }: Props) {
  const [currentId, setCurrentId] = useState(id)
  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <FullScreenModal
        className="p-0 relative"
        components={{
          OverlayComponent: () => (
            <ArrowNavigation basePath="/agents" onIdChange={setCurrentId} />
          ),
        }}
        scrollRef={scrollRef}
      >
        <AgentDetail id={currentId} scrollRef={scrollRef} />
      </FullScreenModal>
    </>
  )
}
