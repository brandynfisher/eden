'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { getModalUrls } from '@/lib/modal'
import { MasonryContext } from '@/providers/MasonryProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
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
  // creation,
  loadSimilar,
  ...rest
}: {
  // creation?: Creation
  loadSimilar?: boolean
}) => {
  const router = useRouter()
  const { currentIndex, setCurrentIndex, totalItems, currentItem } =
    useContext(MasonryContext)
  // const [ itemData, setItemData ] = useState<Creation>(creation)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // console.log(event.key, currentIndex, totalItems)

      if (event.key === 'ArrowLeft') {
        const prevIndex = currentIndex - 1

        if (prevIndex < 0) {
          // @todo: UI feedback that end of list is reached
          // console.log('start of list')
        } else {
          setCurrentIndex(prevIndex <= 0 ? 0 : prevIndex)
        }
      } else if (event.key === 'ArrowRight') {
        const nextIndex = currentIndex + 1

        if (nextIndex >= totalItems) {
          // @todo: UI feedback that end of list is reached
          // console.log('end of list')
        } else {
          setCurrentIndex(nextIndex)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentIndex, totalItems])

  useEffect(() => {
    if (currentItem) {
      const { pageUrl, modalUrl } = getModalUrls(
        router,
        'creation',
        currentItem._id,
      )
      console.log(currentItem._id, pageUrl, modalUrl)
      // setItemData(currentItem as Creation)
      router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    }
  }, [currentItem])

  return (
    <Modal {...rest} className="modal-full">
      <CreationDetail
        creation={currentItem as Creation}
        isModal={true}
        loadSimilar={loadSimilar}
      />
    </Modal>
  )
}

export default CreationDetailModal
