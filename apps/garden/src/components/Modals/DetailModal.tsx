'use client'

import ArrowNavigationButtons from '@/components/Modals/ArrowNavigationButtons'
import { getModalUrls } from '@/lib/modal'
import { MasonryContext } from '@/providers/MasonryProvider'
import { ItemType } from '@/providers/ModalProvider'
import { Character, Concept, Creation, Creator } from '@edenlabs/eden-sdk'
import { useElementSize } from '@mantine/hooks'
import { App, Modal, ModalProps } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useRef } from 'react'

import Details from '../Detail/Details'

const DetailModal = ({
  itemType,
  maybeLoadMoreFn,
  ...rest
}: {
  itemType: ItemType
  maybeLoadMoreFn: (
    currentIndex: number,
    currentItems: Creation[] | Concept[] | Character[] | Creator[],
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
      maybeLoadMoreFn(newIndex, items)
    }
  }, [currentIndex, items.length])

  const handleNextItem = useCallback(async () => {
    const nextIndex = currentIndex + 1

    if (nextIndex >= items.length) {
      message.info('Reached last item')
    } else {
      setCurrentIndex(nextIndex)
      maybeLoadMoreFn(nextIndex, items)
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
        items[currentIndex],
      )
      // console.log('push', items[currentIndex]._id, pageUrl, modalUrl)
      await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    }

    if (currentIndex !== null) {
      // console.log('changing route')
      handleRouteChange()
    }
  }, [router.asPath, currentIndex, items.length])

  const { ref: containerRef, height: containerHeight } = useElementSize()

  const modalContainerRef = useRef<HTMLDivElement | null>(null)

  // other code...

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

  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth
    document.body.style.paddingRight = `${scrollbarWidth}px`
    document.body.style.overflow = 'hidden'
    document.body.classList.add('relative')
    document.body.classList.add('overflow-hidden')

    return () => {
      document.body.style.paddingRight = ''
      document.body.style.overflow = ''
      document.body.classList.remove('relative')
      document.body.classList.remove('overflow-hidden')
    }
  }, [])

  return (
    <div ref={modalContainerRef}>
      <Modal
        {...rest}
        className="modal-full max-w-7xl"
        getContainer={() =>
          modalContainerRef?.current || document.createElement('div')
        }
      >
        {items[currentIndex] ? (
          <Details
            isModal={true}
            modalContainerRef={containerRef}
            modalContainerHeight={containerHeight}
            itemType={itemType}
            item={items[currentIndex]}
          />
        ) : null}
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
    </div>
  )
}

export default DetailModal
