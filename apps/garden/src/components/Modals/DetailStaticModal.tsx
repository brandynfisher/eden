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
    const handleRouteChange = async () => {
      const { pageUrl, modalUrl } = getModalUrls(router, itemType, item)
      // console.log('push', item._id, pageUrl, modalUrl)
      await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    }

    if (usesUrl && item) {
      // console.log('changing route', currentIndex)
      handleRouteChange()
    }
  }, [router.asPath, usesUrl, item, itemType])

  return (
    <Modal {...rest} className="modal-full max-w-7xl">
      <Details itemType={itemType} item={item} isModal={true} />
    </Modal>
  )
}

export default DetailStaticModal
