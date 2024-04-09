import HighlightCard from '@/components/Card/HighlightCard'
import ImageZoomPan from '@/components/Creation/CreationInterface/media/ImageZoomPan'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import HorizontalSwiper from '@/components/Swiper/HorizontalSwiper/HorizontalSwiper'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import LinkOutlined from '@mui/icons-material/LinkOutlined'
import { Divider } from 'antd'
import Link from 'next/link'
import React, { useState } from 'react'
import { SwiperOptions } from 'swiper/types/swiper-options'

const swiperBreakpoints: SwiperOptions['breakpoints'] = {
  320: {
    slidesPerView: 1,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  640: {
    slidesPerView: 1.1,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  1280: {
    slidesPerView: 1.2,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  2048: {
    slidesPerView: 2.2,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
}

export type HighlightItem = { concept: Concept; creation: Creation }

const HighlightsSwiper = ({ items }: { items: HighlightItem[] }) => {
  const [fullscreenItem, setFullscreenItem] = useState<HighlightItem>()

  return (
    <div className="sm:mb-8">
      <HorizontalSwiper
        title={'Highlights'}
        freeMode={false}
        breakpoints={swiperBreakpoints}
        slides={items.map(item => {
          if (!item || !item.concept) {
            return
          }

          return (
            <HighlightCard
              key={item.concept._id}
              concept={item.concept}
              coverImageUri={item.creation.uri}
              onCoverImageClick={() => setFullscreenItem(item)}
            />
          )
        })}
      />
      {fullscreenItem ? (
        <ImageZoomPan
          overlayContent={
            <div>
              <div className="flex items-center gap-1 flex-wrap">
                <div className="font-bold">Creation:</div>
                <Link
                  className="text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200 flex items-center gap-1"
                  href={`/creations/${fullscreenItem.creation._id}`}
                >
                  {fullscreenItem.creation.name} <LinkOutlined />
                </Link>{' '}
                | made by
                <CreatorProfileLink
                  creatorId={fullscreenItem.creation.user.userId || ''}
                  creatorName={fullscreenItem.creation.user.username || ''}
                  creatorImage={fullscreenItem.creation.user.userImage || ''}
                />
              </div>
              <Divider className="my-2" />
              <div className="flex items-center gap-1 flex-wrap">
                <div className="font-bold">Concept:</div>
                <Link
                  className="text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200 flex items-center gap-1"
                  href={`/concepts/${fullscreenItem.concept._id}`}
                >
                  {fullscreenItem.concept.name} <LinkOutlined />
                </Link>
                | made by
                <CreatorProfileLink
                  creatorId={fullscreenItem.concept.user.userId || ''}
                  creatorName={fullscreenItem.concept.user.username || ''}
                  creatorImage={fullscreenItem.concept.user.userImage || ''}
                />
              </div>
            </div>
          }
          imageUrl={fullscreenItem.creation.uri}
          onCloseHandler={() => setFullscreenItem(undefined)}
        />
      ) : null}
    </div>
  )
}

export default HighlightsSwiper
