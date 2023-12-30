'use client'

import Details from '@/components/Detail/Details'
import { getModalUrls } from '@/lib/modal'
import { ItemType } from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const DetailStaticModal = ({
  item,
  itemType,
  usesUrl,
  ...rest
}: {
  item: Creation
  itemType: ItemType
  usesUrl: boolean
}) => {
  const router = useRouter()
  useEffect(() => {
    if (usesUrl) {
      const { pageUrl, modalUrl } = getModalUrls(router, itemType, item)
      router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    }
  }, [usesUrl, item])

  return (
    <Modal {...rest} className="modal-full max-w-7xl">
      <Details itemType={itemType} item={item} isModal={true} />
    </Modal>
  )
}

export default DetailStaticModal
