'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

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
    <Modal {...rest}>
      <Suspense fallback={<div>Loading</div>}>
        <CreationDetail
          creation={creation}
          isModal={true}
          loadSimilar={loadSimilar}
        />
      </Suspense>
    </Modal>
  )
}

export default CreationDetailModal
