'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React from 'react'

const CreationDetail = dynamic(
  () => import('@/components/Creation/CreationDetail/CreationDetail'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreationDetailModal = ({
  creation,
  loadSimilar,
  ...rest
}: {
  creation: Creation
  loadSimilar?: boolean
}) => {
  return (
    <Modal {...rest} className="modal-full">
      <CreationDetail
        creation={creation}
        isModal={true}
        loadSimilar={loadSimilar}
      />
    </Modal>
  )
}

export default CreationDetailModal
