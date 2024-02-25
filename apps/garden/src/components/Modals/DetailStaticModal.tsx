'use client'

import Details from '@/components/Detail/Details'
import { getModalUrls } from '@/lib/modal'
import { ItemType } from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useElementSize } from '@mantine/hooks'
import { Modal } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef } from 'react'

const DetailStaticModal = ({
  item,
  itemType,
  usesUrl,
  layerIndex,
  ...rest
}: {
  item: Creation
  itemType: ItemType
  usesUrl: boolean
  layerIndex?: number
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

  const { ref: containerRef } = useElementSize()
  const modalContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          const modalWrap = (mutation.target as HTMLElement).querySelector(
            '.ant-modal-wrap',
          )
          if (modalWrap) {
            containerRef.current = modalWrap as HTMLDivElement
            // console.log(containerRef.current); // You can now access .ant-modal-wrap here
          }
        }
      })
    })

    if (modalContainerRef.current) {
      observer.observe(modalContainerRef.current, { childList: true })
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  const getContainer = useCallback(() => {
    if (modalContainerRef && modalContainerRef.current) {
      return modalContainerRef?.current
    }

    const container = document.createElement('div')
    document.body.appendChild(container)
    container.style.zIndex = String(50 + (layerIndex || 0))
    return container
  }, [])

  return (
    <div ref={modalContainerRef}>
      <Modal
        {...rest}
        className="modal-full max-w-7xl z-50"
        getContainer={getContainer}
      >
        <Details itemType={itemType} item={item} isModal={true} />
      </Modal>
    </div>
  )
}

export default DetailStaticModal
