'use client'

import ConceptDetail from '@/components/Concept/ConceptDetail/ConceptDetail'
import ArrowNavigationButtons from '@/components/Modals/ArrowNavigationButtons'
import { getModalUrls } from '@/lib/modal'
import { MasonryContext } from '@/providers/MasonryProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { Modal, ModalProps } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect } from 'react'

const ConceptDetailModalV2 = ({
  maybeLoadMoreFn,
  ...rest
}: {
  maybeLoadMoreFn: (currentIndex: number, currentItems: Concept[]) => void
}) => {
  const { onCancel } = rest as ModalProps
  const router = useRouter()
  const { items, currentIndex, setCurrentIndex } = useContext(MasonryContext)

  const handlePrevItem = useCallback(() => {
    const prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      // @todo: UI feedback that end of list is reached
    } else {
      const newIndex = prevIndex <= 0 ? 0 : prevIndex
      setCurrentIndex(newIndex)
      maybeLoadMoreFn(newIndex, items as Concept[])
    }
  }, [currentIndex, items.length])

  const handleNextItem = useCallback(() => {
    const nextIndex = currentIndex + 1

    if (nextIndex >= items.length) {
      // @todo: UI feedback that end of list is reached
      // console.log('end of list')
    } else {
      setCurrentIndex(nextIndex)
      maybeLoadMoreFn(nextIndex, items as Concept[])
    }
  }, [currentIndex, items.length])

  useEffect(() => {
    if (currentIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrevItem()
      } else if (event.key === 'ArrowRight') {
        handleNextItem()
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
        'concept',
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
      {items[currentIndex] && (
        <ConceptDetail
          concept={items[currentIndex] as Concept}
          isModal={true}
          // loadSimilar={loadSimilar}
        />
      )}
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

export default ConceptDetailModalV2
