'use client'

import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import ModalTitle from '@/components/Modals/ModalTitle'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { useFeedPaginated } from '@/hooks/useFeedPaginated'
import { CONFIG } from '@/lib/config'
import { isImageUrl, isVideoUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useFullscreen } from '@mantine/hooks'
import { Button } from '@mui/material'
import { Modal } from 'antd'
import Image from 'next/image'
// import { timeAgo } from '@/lib/time'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import React, { useEffect, useState } from 'react'

const CustomImage = ({
  src,
  alt,
  className,
  onLoad,
  onLoadStart,
  ...rest
}: {
  src: string
  alt: string
  className?: string
  onLoad?: () => void
  onLoadStart?: () => void
}) => {
  useEffect(() => {
    onLoadStart && onLoadStart()
  }, [])

  return (
    <img {...rest} src={src} alt={alt} onLoad={onLoad} className={className} />
  )
}

const CustomVideo = ({
  onLoad,
  onLoadStart,
  onEnded,
  loop,
  src,
  ...rest
}: {
  onLoad?: () => void
  onEnded?: () => void
  loop?: boolean
  src: string
  onLoadStart: () => void
}) => {
  useEffect(() => {
    onLoadStart && onLoadStart()
  }, [])

  return (
    <VideoResult
      {...rest}
      onLoad={onLoad}
      onEnded={onEnded}
      src={src}
      loop={typeof loop !== 'undefined' ? loop : false}
      muted={false}
      disableControls={true}
    />
  )
}

const ChannelDetailsModal = ({
  itemType,
  orderBy,
  ...rest
}: {
  itemType: ItemType
  orderBy: OrderByParam
}) => {
  const PAGE_LIMIT = 50
  const { items, isEmpty, isLoading, size, maybeLoadMore } = useFeedPaginated(
    itemType,
    { limit: PAGE_LIMIT },
    orderBy,
  )

  const { ref, toggle, fullscreen } = useFullscreen()

  const [focusItem, setFocusItem] = useState<Creation | null>(null)
  const [focusItemIndex, setFocusItemIndex] = useState<number | null>(null)
  const [galleryItems, setGalleryItems] = useState<Creation[] | null>(null)
  // const [createdDateString, setCreatedDateString] = useState('')
  // const timeSinceCreation = focusItem ? timeAgo(focusItem.createdAt) : ''

  const handleClickItem = (item: Creation) => {
    setFocusItemIndex(() => {
      const newIndex = items.findIndex(elem => elem._id === item._id)
      setGalleryItems(items.slice(newIndex, newIndex + 10))
      return newIndex
    })

    const loadedRemaining =
      items.length - (focusItemIndex !== null ? focusItemIndex : 0)
    console.log('remaining loaded', loadedRemaining)
    if (loadedRemaining <= PAGE_LIMIT) {
      console.log('Loading More')
      maybeLoadMore()
    }
  }

  const handlePrevItem = () => {
    setFocusItemIndex(prev => {
      if (prev === null || prev <= 0) {
        setGalleryItems(items.slice(0, 10))
        return 0
      }
      const newIndex = prev - 1
      setGalleryItems(items.slice(newIndex, newIndex + 10))
      return newIndex
    })
  }

  const handleNextItem = () => {
    setFocusItemIndex(prev => {
      const newIndex = (prev === null ? 0 : prev) + 1
      setGalleryItems(items.slice(newIndex, newIndex + 10))
      // setGalleryItems(items.slice(newIndex - 10, newIndex))

      return newIndex
    })
    const loadedRemaining =
      items.length - (focusItemIndex !== null ? focusItemIndex : 0)
    console.log('remaining loaded', loadedRemaining)
    if (loadedRemaining <= PAGE_LIMIT) {
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
      setGalleryItems(items.slice(0, 10))
    }
  }, [isLoading, items.length, focusItem])

  useEffect(() => {
    // console.log('useEffect')
    if (!focusItem) {
      return
    }

    if (isVideoUrl(focusItem.uri)) {
      return
    }

    const timer = setTimeout(() => {
      handleNextItem()
    }, 12500)

    return () => {
      clearTimeout(timer)
    }
  }, [focusItem])

  // console.log({ length: items.length, items, focusItemIndex, focusItem, size })

  const [isImageLoading, setImageLoading] = useState(true)

  const handleMediaLoadStart = () => {
    console.log('handleMediaLoadStart')
    setImageLoading(true)
  }

  const handleMediaLoaded = () => {
    console.log('handleMediaLoaded')
    setImageLoading(false)
  }

  const handleVideoEnded = () => {
    console.log('handleVideoEnded')
    handleNextItem()
  }

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrevItem()
        return
      }

      if (event.key === 'ArrowRight') {
        handleNextItem()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleNextItem])
  //
  // useEffect(() => {
  //   if (focusItem) {
  //     setCreatedDateString(new Date(focusItem.createdAt).toLocaleString())
  //   }
  // }, [focusItem])

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
              <Button onClick={handleNextItem} variant="outlined">
                Next
              </Button>
              <div className="text-xs text-gray-500">
                index: {focusItemIndex !== null ? focusItemIndex : 'n/a'}
              </div>
              <Button onClick={toggle} variant="outlined">
                {fullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
              </Button>
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
            <div className="grid grid-flow-col mb-6 auto-cols-max gap-1 items-center overflow-x-clip">
              {galleryItems &&
                galleryItems.map(item => (
                  <div
                    key={item._id}
                    className="relative h-20 md:h-32 p-1 hover:cursor-pointer hover:scale-105"
                    onClick={() => handleClickItem(item)}
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
                        className={`object-contain max-w-full rounded-md transition-all w-auto ${
                          item._id !== focusItem._id ? 'grayscale' : ''
                        }`}
                      />
                    </span>
                    {/* // render full size image but keep it hidden to act as preloader  */}
                    {isImageUrl(item.uri) ? (
                      <CustomImage
                        key={item._id}
                        src={
                          item.uri ||
                          `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                        }
                        alt={item.name}
                        className="hidden"
                      />
                    ) : null}
                  </div>
                ))}
            </div>

            <div
              ref={ref}
              className={`relative flex justify-center lg:flex lg:flex-grow max-w-full ${
                fullscreen ? 'h-full' : 'max-h-72vh '
              }`}
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
                    onEnded={handleVideoEnded}
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

              <div className="absolute z-10 bottom-0 left-0 max-w-[33%]">
                <div className="bg-gray-900 flex items-center bg-opacity-50 px-4 py-2 rounded-tr-lg h-11">
                  <div className="truncate">{focusItem.name}</div>
                </div>
              </div>
              <div className="absolute flex flex-col justify-center z-10 bottom-0 right-0">
                <div className="flex items-center justify-end px-4 py-4">
                  <div className="flex p-1 bg-white">
                    <QRCodeCanvas
                      value={`/creations/${focusItem._id}`}
                      size={96}
                      level="L"
                    />
                  </div>
                </div>
                <div className="flex gap-1 items-center bg-black bg-opacity-50 px-4 py-2 rounded-tl-lg">
                  <Link
                    href={`/creations/${focusItem._id}`}
                    target="_blank"
                    className="!text-gray-200 hover:!text-gray-400"
                  >
                    <strong>/{focusItem.task.generator.generatorName}</strong>
                  </Link>
                  <div className="flex items-center">
                    <span className="mr-2">by</span>{' '}
                    <CreatorProfileLink
                      creatorId={focusItem.user.userId}
                      creatorName={focusItem.user.username}
                      creatorImage={focusItem.user.userImage}
                      target="_blank"
                    />
                    {/*<div*/}
                    {/*  className="text-gray-700 dark:text-gray-400 text-xs"*/}
                    {/*  title={createdDateString}*/}
                    {/*>*/}
                    {/*  <span className="mx-1">•</span>*/}
                    {/*  {timeSinceCreation} ago*/}
                    {/*</div>*/}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default ChannelDetailsModal
