'use client'

import FollowList from '@/components/Modals/FollowList'
import { useFollowersPaginated } from '@/hooks/useFollowersPaginated'
import { Modal } from 'antd'

const FollowersModal = ({ creatorId, ...rest }: { creatorId: string }) => {
  const { items: followers } = useFollowersPaginated({ userId: creatorId })

  return (
    <Modal {...rest}>
      <h3 className="mb-4">Followers</h3>
      <FollowList listItems={followers} />
    </Modal>
  )
}

export default FollowersModal
