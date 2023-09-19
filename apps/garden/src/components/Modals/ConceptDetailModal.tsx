'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { Concept } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React from 'react'

const ConceptDetail = dynamic(
  () => import('@/components/Concept/ConceptDetail/ConceptDetail'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const ConceptDetailModal = ({ concept, ...rest }: { concept: Concept }) => {
  return (
    <Modal {...rest} className="modal-full">
      <ConceptDetail concept={concept} isModal={true} />
    </Modal>
  )
}

export default ConceptDetailModal
