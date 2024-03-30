import {
  HorizontalSwiperNavNext,
  HorizontalSwiperNavPrev,
} from '@/components/Swiper/HorizontalSwiper/HorizontalSwiperNav'
import ArrowRight from '@mui/icons-material/ArrowRight'
import Link from 'next/link'
import React, { ReactNode, useRef } from 'react'
import 'swiper/css'
import { A11y, Navigation } from 'swiper/modules'
import { Swiper, SwiperClass } from 'swiper/react'
import { SwiperSlide } from 'swiper/react'

const swiperBreakpoints = {
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
}: {
  title: string
  url?: string
  slides: ReactNode[]
  slideClasses?: string
}) => {
  const swiperRef = useRef<SwiperClass>()
  const prevElRef = useRef(null)
  const nextElRef = useRef(null)

  return (
    <div className="mb-4">
      <div className="flex justify-between flex-wrap items-center">
        <h2 className="mb-2">{title}</h2>
        {url ? (
          <Link title={'Show all'} href={url} className="flex items-center">
            Show all <ArrowRight />
          </Link>
        ) : null}
      </div>

      <div className="relative">
        <HorizontalSwiperNavPrev
          navRef={prevElRef}
          onClick={() => swiperRef.current?.slidePrev()}
        />
        <Swiper
          ref={swiperRef}
          onBeforeInit={(swiper: SwiperClass) => {
            // swiper ref is null on initial render, reassign for instance ref to actually work (nav buttons etc)
            swiperRef.current = swiper
          }}
          onInit={(swiper: SwiperClass) => {
            // working around references being null when initially assigned which then breaks event handling etc by reassigning refs when they are actually populated
            swiper.navigation.prevEl = prevElRef.current
            swiper.navigation.nextEl = nextElRef.current
            swiper.navigation.init()
            swiper.navigation.update()
          }}
          modules={[Navigation, A11y]}
          spaceBetween={16}
          breakpoints={swiperBreakpoints}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className={slideClasses}>
              {slide}
            </SwiperSlide>
          ))}
        </Swiper>
        <HorizontalSwiperNavNext
          navRef={nextElRef}
          onClick={() => swiperRef.current?.slideNext()}
        />
      </div>
    </div>
  )
}

export default HorizontalSwiper
