'use client'

import ArrowNavigation from '@/components/modal/arrow-navigation'
import FullScreenModal from '@/components/modal/full-screen-modal'
import CreationDetail from '@/features/detail/creation-detail'
import { useRef, useState } from 'react'

type Props = {
  params: { id: string }
}

export default function CreationsModalPage({ params: { id } }: Props) {
  const [currentId, setCurrentId] = useState(id)
  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <FullScreenModal
        className="p-0 relative"
        components={{
          OverlayComponent: () => (
            <ArrowNavigation basePath="/creations" onIdChange={setCurrentId} />
          ),
        }}
        scrollRef={scrollRef}
      >
        <CreationDetail id={currentId} isModal={true} scrollRef={scrollRef} />
      </FullScreenModal>
    </>
  )
}
