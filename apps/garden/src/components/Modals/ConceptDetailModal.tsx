'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { Concept } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

const ConceptDetail = dynamic(
  () => import('@/components/Concept/ConceptDetail/ConceptDetail'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const ConceptDetailModal = ({ concept, ...rest }: { concept: Concept }) => {
  return (
    <Modal {...rest}>
      <Suspense fallback={<div>Loading</div>}>
        <ConceptDetail concept={concept} isModal={true} />
      </Suspense>
    </Modal>
  )
}

export default ConceptDetailModal
