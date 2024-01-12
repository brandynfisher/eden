'use client'

import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import ModalTitle from '@/components/Modals/ModalTitle'
import { useFeedPaginated } from '@/hooks/useFeedPaginated'
import { CONFIG } from '@/lib/config'
import { isVideoUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { Button } from '@mui/material'
import { Modal } from 'antd'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

const CustomImage = ({
  onLoadStart,
  ...rest
}: {
  onLoadStart?: () => void
}) => {
  useEffect(() => {
    onLoadStart && onLoadStart()
  }, [])

  return <img {...rest} />
}

const CustomVideo = ({ onLoadStart, ...rest }: { onLoadStart: () => void }) => {
  useEffect(() => {
    onLoadStart && onLoadStart()
  }, [])

  return <VideoResult {...rest} />
}

const ChannelDetailsModal = ({
  itemType,
  orderBy,
  ...rest
}: {
  itemType: ItemType
  orderBy: OrderByParam
}) => {
  const { items, isEmpty, isLoading, size, maybeLoadMore } = useFeedPaginated(
    itemType,
    { limit: 2 },
    orderBy,
  )

  const [focusItem, setFocusItem] = useState<Creation | null>(null)
  const [focusItemIndex, setFocusItemIndex] = useState<number | null>(null)

  const handleNextItem = () => {
    setFocusItemIndex(prev => (prev === null ? 0 : prev) + 1)
    const loadedRemaining =
      items.length - (focusItemIndex !== null ? focusItemIndex : 0)
    console.log('remaining loaded', loadedRemaining)
    if (loadedRemaining <= 2) {
      console.log('Loading More')
      maybeLoadMore()
    }
  }

  useEffect(() => {
    if (focusItemIndex === null) {
      return
    }
    console.log('render modal, focus item', focusItemIndex, { size })
    setFocusItem(items[focusItemIndex])

    // setIsLoadingImage(true)
  }, [focusItemIndex])

  useEffect(() => {
    // console.log('useEffect')
    if (!isLoading && items.length && !focusItem) {
      // console.log({length: items.length, focusItemIndex})
      setFocusItemIndex(0)
    }
  }, [isLoading, items.length, focusItem])

  console.log({ length: items.length, items, focusItemIndex, focusItem, size })

  const [isImageLoading, setImageLoading] = useState(true)

  const handleMediaLoadStart = () => {
    console.log('handleImageLoadStart')
    setImageLoading(true)
  }

  const handleMediaLoaded = () => {
    console.log('handleImageLoad')
    setImageLoading(false)
  }

  return (
    <Modal
      {...rest}
      className="modal-small modal-grow max-w-6xl pb-0 flex flex-col w-full items-center justify-center"
    >
      <ModalTitle
        title={`Channel: ${orderBy.label}`}
        link={
          <>
            <div className="flex items-center gap-2">
              <div>index: {focusItemIndex}</div>
              <Button onClick={handleNextItem}>Next</Button>
            </div>
          </>
        }
      />

      <div className="relative mt-2 !pt-0 p-2 flex flex-col">
        {isLoading ? (
          <div>
            <LoadingIndicator />
          </div>
        ) : !focusItem || focusItemIndex === null || isEmpty ? (
          <div>No items found</div>
        ) : (
          <>
            <div className="grid grid-flow-col mb-6 auto-cols-max hover:auto-cols-min gap-1 items-center overflow-x-clip">
              {items.map(item => (
                <div
                  key={item._id}
                  className="relative w-20 h-20 md:w-32 md:h-32 p-1"
                >
                  <span className="overflow-hidden rounded-md">
                    <Image
                      alt={item.name}
                      src={
                        item.thumbnail
                          ? item.thumbnail
                          : `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                      }
                      width={120}
                      height={120}
                      className={`object-contain max-w-full rounded-md transition-all ${
                        item._id !== focusItem._id ? 'grayscale' : 'scale-105'
                      }`}
                    />
                  </span>
                  {/*<div className="text-xs">{item.mediaAttributes?.aspectRatio?.toFixed(3)}</div>*/}
                </div>
              ))}
            </div>

            <div
              className="relative flex justify-center lg:flex lg:flex-grow max-h-72vh max-w-full"
              style={{
                aspectRatio: `${focusItem.mediaAttributes.aspectRatio || 1}`,
              }}
            >
              {isImageLoading ? (
                <div className="absolute inset-0 rounded-md">
                  <LoadingIndicator />
                </div>
              ) : null}
              <Image
                key={`${focusItem._id}_placeholder`}
                alt={focusItem.name}
                src={
                  focusItem.thumbnail
                    ? focusItem.thumbnail
                    : `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                }
                width={120}
                height={120}
                className={`object-contain absolute w-full h-full max-w-full max-h-full`}
              />
              {isVideoUrl(focusItem.uri) ? (
                <>
                  <CustomVideo
                    key={focusItem._id}
                    src={focusItem.uri}
                    onLoadStart={handleMediaLoadStart}
                    onLoad={handleMediaLoaded}
                    disableControls={true}
                  />
                </>
              ) : (
                <CustomImage
                  key={focusItem._id}
                  src={
                    focusItem.uri ||
                    `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                  }
                  alt={focusItem.name}
                  onLoadStart={handleMediaLoadStart}
                  onLoad={handleMediaLoaded}
                  className="z-10"
                />
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default ChannelDetailsModal
