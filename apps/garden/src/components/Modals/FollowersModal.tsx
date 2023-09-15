'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

const FollowList = dynamic(() => import('@/components/Profile/FollowList'), {
  loading: () => <LoadingIndicator />,
})

const FollowersModal = ({ creatorId, ...rest }: { creatorId: string }) => {
  return (
    <Modal {...rest}>
      <Suspense fallback={<div>Loading</div>}>
        <FollowList
          creatorId={creatorId}
          type={'followers'}
          title="Followers"
        />
      </Suspense>
    </Modal>
  )
}

export default FollowersModal
