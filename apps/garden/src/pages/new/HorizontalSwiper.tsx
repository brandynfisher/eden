import { ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material'
import ArrowRight from '@mui/icons-material/ArrowRight'
import Link from 'next/link'
import React, { ReactNode, RefObject, useRef } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import { A11y, Navigation, Pagination, Scrollbar } from 'swiper/modules'
import { Swiper, SwiperClass } from 'swiper/react'
import { SwiperSlide } from 'swiper/react'

const SwiperNav = ({
  navRef,
  children,
  onClick,
  className,
}: {
  navRef: RefObject<HTMLDivElement>
  children: ReactNode
  onClick: () => void
  className?: string
}) => {
  return (
    <div
      ref={navRef}
      onClick={onClick}
      className={`absolute z-10 h-full w-12 top-0 opacity-100 flex items-center transition-opacity duration-300 cursor-pointer group from-transparent to-black ${
        className ? className : ''
      }`}
    >
      {children}
    </div>
  )
}

const SwiperNavPrev = ({
  navRef,
  onClick,
}: {
  navRef: RefObject<HTMLDivElement>
  onClick: () => void
}) => {
  return (
    <SwiperNav
      navRef={navRef}
      onClick={onClick}
      className="left-0 bg-gradient-to-l"
    >
      <ChevronLeftRounded
        fontSize="large"
        className="text-gray-300 group-hover:scale-125 group-hover:text-gray-200"
      />
    </SwiperNav>
  )
}

const SwiperNavNext = ({
  navRef,
  onClick,
}: {
  navRef: RefObject<HTMLDivElement>
  onClick: () => void
}) => {
  return (
    <SwiperNav
      navRef={navRef}
      onClick={onClick}
      className="right-0 bg-gradient-to-r"
    >
      <ChevronRightRounded
        fontSize="large"
        className="text-gray-300 group-hover:scale-125 group-hover:text-gray-200 !w-12"
      />
    </SwiperNav>
  )
}

const HorizontalSwiper = ({
  title,
  url,
  slides,
}: {
  title: string
  url: string
  slides: ReactNode[]
}) => {
  const prevElRef = useRef(null)
  const nextElRef = useRef(null)
  const swiperRef = useRef<SwiperClass>()

  return (
    <div className="mb-4">
      <div className="flex justify-between flex-wrap items-center">
        <h2 className="mb-2">{title}</h2>
        <Link title={'Show all'} href={url} className="flex items-center">
          Show all <ArrowRight />
        </Link>
      </div>

      <div className="relative">
        <SwiperNavPrev
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
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={16}
          scrollbar={{
            hide: false,
          }}
          pagination={{
            enabled: false,
          }}
          breakpoints={{
            420: {
              slidesPerView: 1.25,
              pagination: {
                enabled: true,
                clickable: true,
              },
              navigation: {
                disabledClass: '!opacity-0 pointer-events-none',
              },
            },
            512: {
              slidesPerView: 2.25,
              pagination: {
                enabled: true,
                clickable: true,
              },
              navigation: {
                disabledClass: '!opacity-0 pointer-events-none',
              },
            },
            768: {
              slidesPerView: 3.25,
              pagination: {
                enabled: true,
                clickable: true,
              },
              navigation: {
                disabledClass: '!opacity-0 pointer-events-none',
              },
            },
            1024: {
              slidesPerView: 'auto',
              pagination: {
                enabled: false,
              },
              navigation: {
                disabledClass: '!opacity-0 pointer-events-none',
              },
            },
          }}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className="lg:max-w-[300px]">
              {slide}
            </SwiperSlide>
          ))}
        </Swiper>
        <SwiperNavNext
          navRef={nextElRef}
          onClick={() => swiperRef.current?.slideNext()}
        />
      </div>
    </div>
  )
}

export default HorizontalSwiper
