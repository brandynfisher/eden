// import HighlightSlideSkeleton from '@/components/Swiper/HighlightSlideSkeleton'
import HorizontalSwiper from '@/components/Swiper/HorizontalSwiper/HorizontalSwiper'
import HighlightCard from '@/pages/new/HighlightCard'
import React from 'react'
import { SwiperOptions } from 'swiper/types/swiper-options'

const dummyItems = [
  {
    conceptId: '655f71ac000112de0bece126',
    coverImageUri:
      'https://edenartlab-stage-data.s3.us-east-1.amazonaws.com/ba44da70d2caa1dd8bd909c80e9f5f5e91fe08bab50e387706eac98db768e9cb.jpg',
  },
  {
    conceptId: '655f6eb5000112de0be180c0',
    coverImageUri:
      'https://edenartlab-stage-data.s3.us-east-1.amazonaws.com/ac9fc10de7e75d32e5cab043f8e6d17ddb73391bb862edaa7b5219f9f7fcdc42.jpg',
  },
]

const swiperBreakpoints: SwiperOptions['breakpoints'] = {
  640: {
    slidesPerView: 1,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  768: {
    slidesPerView: 1.25,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  1024: {
    slidesPerView: 1.25,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  1280: {
    slidesPerView: 'auto',
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
}

const HighlightsSwiper = () => {
  return (
    <HorizontalSwiper
      title={'Highlights'}
      freeMode={false}
      breakpoints={swiperBreakpoints}
      slides={dummyItems.map(item => (
        <HighlightCard
          key={item.conceptId}
          conceptId={item.conceptId}
          coverImageUri={item.coverImageUri}
        />
      ))}
    />
  )
}

export default HighlightsSwiper
