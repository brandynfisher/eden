import {
  HorizontalSwiperNavNext,
  HorizontalSwiperNavPrev,
} from '@/components/Swiper/HorizontalSwiper/HorizontalSwiperNav'
import ArrowRight from '@mui/icons-material/ArrowRight'
import Link from 'next/link'
import React, { ReactNode, useRef, useState } from 'react'
import 'swiper/css'
import { A11y, FreeMode, Mousewheel, Navigation } from 'swiper/modules'
import { Swiper, SwiperClass } from 'swiper/react'
import { SwiperSlide } from 'swiper/react'
import { SwiperOptions } from 'swiper/types/swiper-options'

const defaultBreakpoints: SwiperOptions['breakpoints'] = {
  420: {
    slidesPerView: 1.25,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  512: {
    slidesPerView: 2.25,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  768: {
    slidesPerView: 3.25,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  1024: {
    slidesPerView: 'auto',
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
}

const HorizontalSwiper = ({
  title,
  url,
  slides,
  slideClasses,
  breakpoints,
  freeMode,
}: {
  title: string
  url?: string
  slides: ReactNode[]
  slideClasses?: string
  breakpoints?: SwiperOptions['breakpoints']
  freeMode?: boolean
}) => {
  const swiperRef = useRef<SwiperClass>(null)
  const prevElRef = useRef<HTMLDivElement>(null)
  const nextElRef = useRef<HTMLDivElement>(null)

  const [showPrev, setShowPrev] = useState(false)
  const [showNext, setShowNext] = useState(slides.length > 1)

  return (
    <div className="sm:mb-2">
      <div className="flex justify-between flex-wrap items-center mb-2">
        <h2 className="mb-2">{title}</h2>
        {url ? (
          <Link
            title={'Explore all'}
            href={url}
            className="flex items-center text-lg text-gray-500 dark:text-gray-300 hover:dark:text-gray-300"
          >
            Explore all
            <ArrowRight />
          </Link>
        ) : null}
      </div>

      <div className="relative">
        <div className={`${showPrev ? '' : 'hidden'}`}>
          <HorizontalSwiperNavPrev
            navRef={prevElRef}
            onClick={() => swiperRef.current?.slidePrev()}
          />
        </div>
        <Swiper
          //@ts-ignore
          ref={swiperRef}
          onBeforeInit={(swiper: SwiperClass) => {
            // swiper ref is null on initial render, reassign for instance ref to actually work (nav buttons etc)
            // @ts-ignore
            swiperRef.current = swiper
          }}
          onSlideChange={(swiper: SwiperClass) => {
            if (swiper.isBeginning) {
              setShowPrev(false)
            } else {
              setShowPrev(true)
            }

            if (swiper.isEnd) {
              setShowNext(false)
            } else {
              setShowNext(true)
            }
          }}
          onInit={(swiper: SwiperClass) => {
            // navigation fix: working around references being null when initially assigned which then breaks event handling etc by reassigning refs when they are actually populated
            if (prevElRef && prevElRef.current) {
              swiper.navigation.prevEl = prevElRef.current
            }

            if (nextElRef && nextElRef.current) {
              swiper.navigation.nextEl = nextElRef.current
            }

            swiper.navigation.init()
            swiper.navigation.update()
          }}
          modules={[Navigation, Mousewheel, FreeMode, A11y]}
          spaceBetween={16}
          breakpoints={breakpoints ? breakpoints : defaultBreakpoints}
          direction="horizontal"
          mousewheel={{ forceToAxis: true }}
          freeMode={{
            enabled: freeMode,
          }}
          // grabCursor={true}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className={slideClasses}>
              {slide}
            </SwiperSlide>
          ))}
        </Swiper>
        <div className={`${showNext ? '' : 'hidden'}`}>
          <HorizontalSwiperNavNext
            navRef={nextElRef}
            onClick={() => swiperRef.current?.slideNext()}
          />
        </div>
      </div>
    </div>
  )
}

export default HorizontalSwiper
