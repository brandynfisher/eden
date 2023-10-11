'use client'

import CircleButton from '@/components/Layout/buttons/CircleButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import { getModalUrls } from '@/lib/modal'
import { MasonryContext } from '@/providers/MasonryProvider'
import { Creation } from '@edenlabs/eden-sdk'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Modal, ModalProps } from 'antd'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect } from 'react'

const CreationDetail = dynamic(
  () => import('@/components/Creation/CreationDetail/CreationDetail'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreationDetailModalV2 = ({
  maybeLoadMoreFn,
  ...rest
}: {
  maybeLoadMoreFn: (currentIndex: number, currentItems: Creation[]) => void
}) => {
  const { onCancel } = rest as ModalProps
  const router = useRouter()
  const { items, currentIndex, setCurrentIndex } = useContext(MasonryContext)

  const handlePrevItem = useCallback(() => {
    const prevIndex = currentIndex - 1

    // console.log({ prevIndex })
    if (prevIndex < 0) {
      // @todo: UI feedback that end of list is reached
      // console.log('start of list')
    } else {
      const newIndex = prevIndex <= 0 ? 0 : prevIndex
      setCurrentIndex(newIndex)
      maybeLoadMoreFn(newIndex, items as Creation[])
    }
  }, [setCurrentIndex, maybeLoadMoreFn, currentIndex, items])

  const handleNextItem = useCallback(() => {
    const nextIndex = currentIndex + 1

    // console.log({ nextIndex })
    if (nextIndex >= items.length) {
      // @todo: UI feedback that end of list is reached
      // console.log('end of list')
    } else {
      setCurrentIndex(nextIndex)
      maybeLoadMoreFn(nextIndex, items as Creation[])
    }
  }, [setCurrentIndex, maybeLoadMoreFn, currentIndex, items])

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
        'creation',
        items[currentIndex]._id,
      )
      // console.log(currentItem._id, pageUrl, modalUrl)
      await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    }

    if (currentIndex !== null) {
      handleRouteChange()
    }
  }, [router, currentIndex, items])

  return (
    <Modal {...rest} className="modal-full max-w-7xl">
      {items[currentIndex] && (
        <CreationDetail
          creation={items[currentIndex] as Creation}
          isModal={true}
          // loadSimilar={loadSimilar}
        />
      )}
      {currentIndex !== null ? (
        <div className="fixed bottom-4 w-fit left-[calc(50%_-_77px)] md:bottom-auto flex md:justify-between md:top-1/2 md:w-[calc(100vw_-_32px)] md:left-2 gap-4 bg-gray-200 dark:bg-gray-950 rounded-full border border-solid border-gray-600 md:border-none md:p-0 md:!bg-transparent md:dark!bg-transparent opacity-0 anim-fade-in shadow-2xl md:shadow-none z-10 pointer-events-none">
          <div className="justify-self-start pointer-events-auto">
            <CircleButton
              disabled={currentIndex - 1 < 0}
              title={'Prev'}
              icon={<KeyboardArrowLeftIcon fontSize="large" />}
              onClick={handlePrevItem}
            />
          </div>
          <div className="pointer-events-auto md:hidden">
            <CircleButton
              title={'Close'}
              icon={<CloseIcon fontSize="large" />}
              //@ts-ignore
              onClick={onCancel}
            />
          </div>
          <div className="justify-self-end pointer-events-auto">
            <CircleButton
              disabled={currentIndex + 1 >= items.length}
              title={'Next'}
              icon={<KeyboardArrowRightIcon fontSize="large" />}
              onClick={handleNextItem}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default CreationDetailModalV2
