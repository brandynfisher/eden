'use client'

import FollowList from '@/components/Modals/FollowList'
import { useFollowingPaginated } from '@/hooks/useFollowingPaginated'
import { Modal } from 'antd'

const FollowersModal = ({ creatorId, ...rest }: { creatorId: string }) => {
  const { items: following } = useFollowingPaginated({ userId: creatorId })

  return (
    <Modal {...rest}>
      <h3 className="mb-4">Following</h3>
      <FollowList listItems={following} />
    </Modal>
  )
}

export default FollowersModal
