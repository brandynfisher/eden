'use client'

import FollowList from '@/components/Modals/FollowList'
import { Modal } from 'antd'

const FollowersModal = ({ creatorId, ...rest }: { creatorId: string }) => {
  return (
    <Modal {...rest}>
      <FollowList creatorId={creatorId} type={'followers'} title="Followers" />
    </Modal>
  )
}

export default FollowersModal
