'use client'

import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const CreationDetailModal = ({ creation, ...rest }: { creation: Creation }) => {
  const CreationDetail = dynamic(
    () => import('@/components/Creation/CreationDetail/CreationDetail'),
    {
      suspense: true,
    },
  )

  return (
    <Modal {...rest}>
      <Suspense fallback={<div>Loading</div>}>
        <CreationDetail creation={creation} isModal={true} />
      </Suspense>
    </Modal>
  )
}

export default CreationDetailModal
