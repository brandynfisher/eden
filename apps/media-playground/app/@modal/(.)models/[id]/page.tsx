'use client'

import ArrowNavigation from '@/components/modal/arrow-navigation'
import FullScreenModal from '@/components/modal/full-screen-modal'
import ModelDetail from '@/features/detail/model-detail'
import { useRef, useState } from 'react'

type Props = {
  params: { id: string }
}

export default function ModelsModalPage({ params: { id } }: Props) {
  const [currentId, setCurrentId] = useState(id)

  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <FullScreenModal
        className="p-0 relative"
        components={{
          OverlayComponent: () => (
            <ArrowNavigation basePath="/models" onIdChange={setCurrentId} />
          ),
        }}
        scrollRef={scrollRef}
      >
        <ModelDetail id={currentId} isModal={true} scrollRef={scrollRef} />
      </FullScreenModal>
    </>
  )
}
