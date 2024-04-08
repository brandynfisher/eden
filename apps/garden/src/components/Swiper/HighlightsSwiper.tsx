// import HighlightSlideSkeleton from '@/components/Swiper/HighlightSlideSkeleton'
import HighlightCard from '@/components/Card/HighlightCard'
import HorizontalSwiper from '@/components/Swiper/HorizontalSwiper/HorizontalSwiper'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'
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
  // 768: {
  //   slidesPerView: 1.25,
  //   navigation: {
  //     disabledClass: '!opacity-0 pointer-events-none',
  //   },
  // },
  // 1024: {
  //   slidesPerView: 1.25,
  //   navigation: {
  //     disabledClass: '!opacity-0 pointer-events-none',
  //   },
  // },
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

const HighlightsSwiper = ({
  items,
}: {
  items: { concept?: Concept; coverImageUri: string }[]
}) => {
  return (
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
            key={item?.concept?._id}
            concept={item?.concept}
            coverImageUri={item?.coverImageUri}
          />
        )
      })}
    />
  )
}

export default HighlightsSwiper
