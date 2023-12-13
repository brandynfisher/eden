'use client'

import Details from '@/components/Detail/Details'
import { getModalUrls } from '@/lib/modal'
import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const CreationDetailStaticModal = ({
  creation,
  usesUrl,
  // loadSimilar,
  ...rest
}: {
  creation: Creation
  usesUrl: boolean
  loadSimilar?: boolean
}) => {
  const router = useRouter()
  useEffect(() => {
    if (usesUrl) {
      const { pageUrl, modalUrl } = getModalUrls(
        router,
        'creation',
        creation._id,
      )
      router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    }
  }, [usesUrl, creation])

  return (
    <Modal {...rest} className="modal-full max-w-7xl">
      <Details
        itemType="creation"
        item={creation}
        isModal={true}
        // loadSimilar={loadSimilar}
      />
    </Modal>
  )
}

export default CreationDetailStaticModal
