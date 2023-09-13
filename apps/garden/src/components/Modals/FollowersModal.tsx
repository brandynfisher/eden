'use client'

import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const FollowersModal = ({ creatorId, ...rest }: { creatorId: string }) => {
  const FollowList = dynamic(() => import('@/components/Profile/FollowList'), {
    suspense: true,
  })

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
