'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React from 'react'

const FollowList = dynamic(() => import('@/components/Profile/FollowList'), {
  loading: () => <LoadingIndicator />,
})

const FollowersModal = ({ creatorId, ...rest }: { creatorId: string }) => {
  return (
    <Modal {...rest}>
      <FollowList creatorId={creatorId} type={'following'} title="Following" />
    </Modal>
  )
}

export default FollowersModal
