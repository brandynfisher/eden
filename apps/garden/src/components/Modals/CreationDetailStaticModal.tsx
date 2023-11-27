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
  }, [router, usesUrl, creation])

  return (
    <Modal {...rest} className="modal-full max-w-7xl">
      <CreationDetail
        creation={creation}
        isModal={true}
        // loadSimilar={loadSimilar}
      />
    </Modal>
  )
}

export default CreationDetailStaticModal
