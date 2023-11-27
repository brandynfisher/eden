'use client'

import ModalTitle from '@/components/Modals/ModalTitle'
import FollowList from '@/components/Profile/FollowList'
import { Modal } from 'antd'
import React, { useState } from 'react'

const FollowingModal = ({ creatorId, ...rest }: { creatorId: string }) => {
  const [itemCount, setItemCount] = useState(0)

  return (
    <Modal
      {...rest}
      className="modal-small max-w-md flex flex-col w-full items-center justify-center"
    >
      <ModalTitle title={`Following (${itemCount})`} />
      <div className="p-2">
        <FollowList
          creatorId={creatorId}
          type={'following'}
          setItemCount={setItemCount}
        />
      </div>
    </Modal>
  )
}

export default FollowingModal
