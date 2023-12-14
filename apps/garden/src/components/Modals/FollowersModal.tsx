'use client'

import ModalTitle from '@/components/Modals/ModalTitle'
import FollowList from '@/components/Profile/FollowList'
import { Modal } from 'antd'
import React, { useState } from 'react'

const FollowersModal = ({ creatorId, ...rest }: { creatorId: string }) => {
  const [itemCount, setItemCount] = useState(0)

  return (
    <Modal
      {...rest}
      className="modal-small max-w-md flex flex-col w-full items-center justify-center"
    >
      <ModalTitle title={`Followers (${itemCount})`} />
      <div className="p-2">
        <FollowList
          creatorId={creatorId}
          type={'followers'}
          setItemCount={setItemCount}
        />
      </div>
    </Modal>
  )
}

export default FollowersModal
