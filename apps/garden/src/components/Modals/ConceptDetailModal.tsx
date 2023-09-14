'use client'

import { Concept } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const ConceptDetailModal = ({ concept, ...rest }: { concept: Concept }) => {
  const ConceptDetail = dynamic(
    () => import('@/components/Concept/ConceptDetail/ConceptDetail'),
    {
      suspense: true,
    },
  )

  return (
    <Modal {...rest}>
      <Suspense fallback={<div>Loading</div>}>
        <ConceptDetail concept={concept} isModal={true} />
      </Suspense>
    </Modal>
  )
}

export default ConceptDetailModal
