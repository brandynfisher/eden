'use client'

import ConceptDetail from '@/components/Concept/ConceptDetail/ConceptDetail'
import CreationDetail from '@/components/Creation/CreationDetail/CreationDetail'
import ArrowNavigationButtons from '@/components/Modals/ArrowNavigationButtons'
import { getModalUrls } from '@/lib/modal'
import { MasonryContext } from '@/providers/MasonryProvider'
import { ItemType } from '@/providers/ModalProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { App, Modal, ModalProps } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect } from 'react'

const DetailModal = ({
  itemType,
  maybeLoadMoreFn,
  ...rest
}: {
  itemType: ItemType
  maybeLoadMoreFn: (
    currentIndex: number,
    currentItems: Creation[] | Concept[],
  ) => void
}) => {
  const { message } = App.useApp()
  const { onCancel } = rest as ModalProps
  const router = useRouter()
  const { items, currentIndex, setCurrentIndex } = useContext(MasonryContext)

  const handlePrevItem = useCallback(async () => {
    const prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      message.info('Reached first item')
    } else {
      const newIndex = prevIndex <= 0 ? 0 : prevIndex
      setCurrentIndex(newIndex)
      maybeLoadMoreFn(newIndex, items as Creation[])
    }
  }, [currentIndex, items.length])

  const handleNextItem = useCallback(async () => {
    const nextIndex = currentIndex + 1

    if (nextIndex >= items.length) {
      message.info('Reached last item')
    } else {
      setCurrentIndex(nextIndex)
      maybeLoadMoreFn(nextIndex, items as Creation[])
    }
  }, [currentIndex, items.length])

  useEffect(() => {
    if (currentIndex === null) return

    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        await handlePrevItem()
      } else if (event.key === 'ArrowRight') {
        await handleNextItem()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentIndex, handlePrevItem, handleNextItem])

  useEffect(() => {
    // console.log(currentIndex, items)
    const handleRouteChange = async () => {
      const { pageUrl, modalUrl } = getModalUrls(
        router,
        itemType,
        items[currentIndex]._id,
      )
      // console.log(currentItem._id, pageUrl, modalUrl)
      await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    }

    if (currentIndex !== null) {
      handleRouteChange()
    }
  }, [router.asPath, currentIndex, items.length])

  return (
    <Modal {...rest} className="modal-full max-w-7xl">
      {items[currentIndex] &&
        (itemType === 'creation' ? (
          <CreationDetail
            creation={items[currentIndex] as Creation}
            isModal={true}
            // loadSimilar={loadSimilar}
          />
        ) : (
          <ConceptDetail
            concept={items[currentIndex] as Concept}
            isModal={true}
            // loadSimilar={loadSimilar}
          />
        ))}
      {currentIndex !== null ? (
        <ArrowNavigationButtons
          items={items}
          currentIndex={currentIndex}
          handlePrev={handlePrevItem}
          handleNext={handleNextItem}
          handleCancel={onCancel}
        />
      ) : null}
    </Modal>
  )
}

export default DetailModal
