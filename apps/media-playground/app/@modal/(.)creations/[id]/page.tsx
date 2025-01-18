'use client'

import ArrowNavigation from '@/components/modal/arrow-navigation'
import FullScreenModal from '@/components/modal/full-screen-modal'
import CreationDetail from '@/features/detail/creation-detail'
import { useState } from 'react'

type Props = {
  params: { id: string }
}

export default function CreationsModalPage({ params: { id } }: Props) {
  const [currentId, setCurrentId] = useState(id)

  return (
    <>
      <FullScreenModal
        className="p-0 relative"
        components={{
          OverlayComponent: () => (
            <ArrowNavigation basePath="/creations" onIdChange={setCurrentId} />
          ),
        }}
      >
        <CreationDetail id={currentId} isModal={true} />
      </FullScreenModal>
    </>
  )
}
