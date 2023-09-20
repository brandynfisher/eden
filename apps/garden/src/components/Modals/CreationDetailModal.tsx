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
import React, { useContext, useEffect } from 'react'

const CreationDetail = dynamic(
  () => import('@/components/Creation/CreationDetail/CreationDetail'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreationDetailModal = ({
  loadSimilar,
  ...rest
}: {
  loadSimilar?: boolean
}) => {
  const { onCancel } = rest as ModalProps
  const router = useRouter()
  const { currentIndex, setCurrentIndex, totalItems, currentItem } =
    useContext(MasonryContext)
  const handlePrevItem = (index: number) => {
    const prevIndex = index - 1

    if (prevIndex < 0) {
      // @todo: UI feedback that end of list is reached
      // console.log('start of list')
    } else {
      setCurrentIndex(prevIndex <= 0 ? 0 : prevIndex)
    }
  }

  const handleNextItem = (index: number) => {
    const nextIndex = index + 1

    if (nextIndex >= totalItems) {
      // @todo: UI feedback that end of list is reached
      // console.log('end of list')
    } else {
      setCurrentIndex(nextIndex)
    }
  }

  useEffect(() => {
    if (currentIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrevItem(currentIndex)
      } else if (event.key === 'ArrowRight') {
        handleNextItem(currentIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentIndex, totalItems, handlePrevItem, handleNextItem])

  useEffect(() => {
    if (currentItem) {
      const { pageUrl, modalUrl } = getModalUrls(
        router,
        'creation',
        currentItem._id,
      )
      // console.log(currentItem._id, pageUrl, modalUrl)
      router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    }
  }, [currentItem])

  return (
    <Modal {...rest} className="modal-full max-w-7xl">
      {currentItem && (
        <CreationDetail
          creation={currentItem as Creation}
          isModal={true}
          loadSimilar={loadSimilar}
        />
      )}
      {currentIndex !== null ? (
        <div className="fixed bottom-4 w-fit left-[calc(50%_-_77px)] md:bottom-auto flex md:justify-between md:top-1/2 md:w-[calc(100vw_-_32px)] md:left-2 gap-4 bg-gray-200 dark:bg-gray-950 rounded-full border border-solid border-gray-600 md:border-none md:p-0 md:!bg-transparent md:dark!bg-transparent opacity-0 anim-fade-in shadow-2xl md:shadow-none z-10">
          <div className="justify-self-start pointer-events-auto">
            <CircleButton
              disabled={currentIndex - 1 < 0}
              title={'Prev'}
              icon={<KeyboardArrowLeftIcon fontSize="large" />}
              onClick={() => handlePrevItem(currentIndex)}
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
              disabled={currentIndex + 1 >= totalItems}
              title={'Next'}
              icon={<KeyboardArrowRightIcon fontSize="large" />}
              onClick={() => handleNextItem(currentIndex)}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default CreationDetailModal
