'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { getModalUrls } from '@/lib/modal'
import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const CreationDetail = dynamic(
  () => import('@/components/Creation/CreationDetail/CreationDetail'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreationDetailStaticModal = ({
  creation,
  loadSimilar,
  ...rest
}: {
  creation: Creation
  loadSimilar?: boolean
}) => {
  const router = useRouter()

  useEffect(() => {
    const { pageUrl, modalUrl } = getModalUrls(router, 'creation', creation._id)
    // console.log(creation._id, pageUrl, modalUrl)
    router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
  }, [creation])

  return (
    <Modal {...rest} className="modal-full">
      <CreationDetail
        creation={creation}
        isModal={true}
        loadSimilar={loadSimilar}
      />
    </Modal>
  )
}

export default CreationDetailStaticModal
