'use client'

import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import ModalTitle from '@/components/Modals/ModalTitle'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import {
  FeedRouteQueryParams,
  useFeedPaginated,
} from '@/hooks/useFeedPaginated'
import { CONFIG } from '@/lib/config'
import { isVideoUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useFullscreen } from '@mantine/hooks'
import { Button } from '@mui/material'
import { Modal } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import React, { useCallback, useEffect, useState } from 'react'

// import { createPaginationRoute } from '@/lib/fetcher'

// import DurationProgressBar from '@/components/Layout/DurationProgressBar'

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
  }, [onLoadStart])

  return (
    <img {...rest} src={src} alt={alt} onLoad={onLoad} className={className} />
  )
}

const CustomVideo = ({
  onLoad,
  onLoadStart,
  onEnded,
  autoPlay,
  preload,
  loop,
  muted,
  src,
  className,
  ...rest
}: {
  onLoad?: () => void
  onEnded?: () => void
  autoPlay?: boolean
  preload?: boolean
  loop?: boolean
  muted?: boolean
  src: string
  onLoadStart?: () => void
  className?: string
}) => {
  useEffect(() => {
    onLoadStart && onLoadStart()
  }, [onLoadStart])

  return (
    <VideoResult
      {...rest}
      onLoad={onLoad}
      onEnded={onEnded}
      src={src}
      autoPlay={autoPlay}
      preload={preload}
      loop={loop}
      muted={muted}
      // disableControls={true}
      className={`video-controls-hover-only ${className ? className : ''}`}
    />
  )
}

export type ChannelSettings = {
  showPrompt: boolean
  showCreator: boolean
  showQrCode: boolean
  imageDisplayDuration: number
  muteVideoAudio: boolean
}

const ChannelDetailsModal = ({
  title,
  itemType,
  orderBy,
  query,
  settings,
  ...rest
}: {
  title?: string
  query?: FeedRouteQueryParams
  itemType: ItemType
  orderBy: OrderByParam
  settings: ChannelSettings
}) => {
  const PAGE_LIMIT = 50

  const { items, isEmpty, isLoading, maybeLoadMore } = useFeedPaginated(
    itemType,
    { ...query, limit: PAGE_LIMIT },
    orderBy,
  )

  const { ref, toggle, fullscreen } = useFullscreen()

  const [focusItem, setFocusItem] = useState<Creation | null>(null)
  const [focusItemIndex, setFocusItemIndex] = useState<number | null>(null)
  const [galleryItems, setGalleryItems] = useState<Creation[] | null>(null)
  const [isImageLoading, setImageLoading] = useState(true)

  // add polling for new creations every x seconds
  // use $gt: query.maxDate as the initial lower bound minDate to get all new creations since modal opened
  // whenever we got new creations, use the moist current creations date as the new cutoff - setMinDate
  // if there's new creations, set newItems
  // if newItems has creations, splice those in to the items array at an index "focusItemIndex + 1"
  // somehow keep track of the amount of new creations
  // think about how to inject even newer items while we're showing new items
  // dont trigger maybeLoadMore while we're using newItems
  //
  // const NEW_ITEMS_POLLING_INTERVAL = 5000
  // const [ minDate, setMinDate ] = useState(query?.maxDate || new Date().toISOString())
  // const [ newItems, setNewItems] = useState<Creation[]>([]);
  //
  // const fetchNewItems = useCallback(() => {
  //   const newItemsQuery = { ...query, maxDate: undefined }
  //   const newItemsRoute = createPaginationRoute(`/api/feed/${itemType}s`, {
  //     ...newItemsQuery,
  //     limit: PAGE_LIMIT,
  //     page: 1,
  //     orderBy: orderBy ? orderBy.field : undefined,
  //     direction: orderBy ? orderBy.direction : undefined,
  //     minDate: minDate
  //   })
  //
  //   return newItemsRoute
  // }, [minDate, itemType, query, orderBy, PAGE_LIMIT])

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     console.log(fetchNewItems())
  //   }, NEW_ITEMS_POLLING_INTERVAL)
  //
  //   return () => {
  //     clearInterval(timer)
  //   }
  // }, [fetchNewItems, NEW_ITEMS_POLLING_INTERVAL])

  const handleClickItem = useCallback(
    (item: Creation) => {
      setFocusItemIndex(() => {
        const newIndex = items.findIndex(elem => elem._id === item._id)
        setGalleryItems(items.slice(newIndex, newIndex + 10))
        return newIndex
      })

      const loadedRemaining =
        items.length - (focusItemIndex !== null ? focusItemIndex : 0)
      // console.log('remaining loaded', loadedRemaining)
      if (loadedRemaining <= PAGE_LIMIT) {
        // console.log('Loading More')
        maybeLoadMore()
      }
    },
    [maybeLoadMore, focusItemIndex, items],
  )

  const handlePrevItem = useCallback(() => {
    setFocusItemIndex(prev => {
      if (prev === null || prev <= 0) {
        setGalleryItems(items.slice(0, 10))
        return 0
      }
      const newIndex = prev - 1
      setGalleryItems(items.slice(newIndex, newIndex + 10))
      return newIndex
    })
  }, [items])

  const handleNextItem = useCallback(() => {
    setFocusItemIndex(prev => {
      const newIndex = (prev === null ? 0 : prev) + 1
      setGalleryItems(items.slice(newIndex, newIndex + 10))
      // setGalleryItems(items.slice(newIndex - 10, newIndex))

      return newIndex
    })
    const loadedRemaining =
      items.length - (focusItemIndex !== null ? focusItemIndex : 0)
    // console.log('remaining loaded', loadedRemaining)
    if (loadedRemaining <= PAGE_LIMIT) {
      // console.log('Loading More')
      maybeLoadMore()
    }
  }, [focusItemIndex, items, maybeLoadMore])

  const handleMediaLoadStart = useCallback(() => {
    // console.log('handleMediaLoadStart')
    setImageLoading(true)
  }, [])

  const handleMediaLoaded = useCallback(() => {
    // console.log('handleMediaLoaded')
    setImageLoading(false)
  }, [])

  const handleVideoEnded = useCallback(() => {
    // console.log('handleVideoEnded')
    handleNextItem()
  }, [handleNextItem])

  useEffect(() => {
    if (focusItemIndex === null) {
      return
    }
    // console.log('render modal, focus item', focusItemIndex, { size })
    setFocusItem(items[focusItemIndex])

    // setIsLoadingImage(true)
  }, [items, focusItemIndex])

  useEffect(() => {
    // // Immediately show a new item
    // if (newItems.length > 0 && focusItemIndex === null) {
    //   setFocusItemIndex(0);
    //   setGalleryItems(newItems.slice(0, 10));
    // }

    // console.log('useEffect')
    if (!isLoading && items.length && !focusItem) {
      // console.log({length: items.length, focusItemIndex})
      setFocusItemIndex(0)
      setGalleryItems(items.slice(0, 10))
    }
  }, [items, isLoading, items.length, focusItem])

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
    }, settings.imageDisplayDuration * 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [handleNextItem, focusItem, settings.imageDisplayDuration])

  // console.log({ length: items.length, items, focusItemIndex, focusItem, size })

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
  }, [handlePrevItem, handleNextItem])

  return (
    <Modal
      {...rest}
      className="modal-small modal-grow max-w-6xl pb-0 flex flex-col w-full items-center justify-center"
    >
      <ModalTitle
        title={`Channel: ${title ? title : orderBy.label}`}
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
                galleryItems.map((item, index) => (
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
                    {index <= 2 ? (
                      <>
                        {isVideoUrl(item.uri) ? (
                          <>
                            <CustomVideo
                              autoPlay={false}
                              preload={true}
                              muted={true}
                              loop={false}
                              key={item._id}
                              src={item.uri}
                              className="hidden"
                            />
                          </>
                        ) : (
                          <CustomImage
                            key={item._id}
                            src={
                              item.uri ||
                              `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                            }
                            alt={item.name}
                            className="hidden"
                          />
                        )}
                      </>
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
              {/*<div className="absolute w-full z-50">*/}
              {/*  <DurationProgressBar key={focusItem._id} duration={5000} />*/}
              {/*</div>*/}
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
                    autoPlay={true}
                    loop={false}
                    muted={settings.muteVideoAudio}
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
                  className="z-10 w-auto"
                />
              )}

              {settings.showPrompt ? (
                <div className="absolute z-10 bottom-0 left-0 max-w-[40%]">
                  <div className="bg-gray-900 flex items-center bg-opacity-50 px-4 py-2 rounded-tr-lg min-h-11">
                    <div className="line-clamp-3">{focusItem.name}</div>
                  </div>
                </div>
              ) : null}
              {settings.showCreator || settings.showQrCode ? (
                <div className="absolute flex flex-col justify-center z-10 bottom-0 right-0">
                  {settings.showQrCode ? (
                    <div className="flex items-center justify-end px-4 py-4 pointer-events-none">
                      <div className="flex p-1 bg-white">
                        <QRCodeCanvas
                          value={`/creations/${focusItem._id}`}
                          size={96}
                          level="L"
                        />
                      </div>
                    </div>
                  ) : null}
                  {settings.showCreator ? (
                    <div className="flex gap-1 items-center bg-black bg-opacity-50 px-4 py-2 rounded-tl-lg">
                      <Link
                        href={`/creations/${focusItem._id}`}
                        target="_blank"
                        className="!text-gray-200 hover:!text-gray-400"
                      >
                        <strong>
                          /{focusItem.task.generator.generatorName}
                        </strong>
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
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default ChannelDetailsModal
