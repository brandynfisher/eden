import { ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material'
import ArrowRight from '@mui/icons-material/ArrowRight'
import Link from 'next/link'
import React, { ReactNode, useRef } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import { A11y, Navigation, Pagination, Scrollbar } from 'swiper/modules'
import { Swiper, SwiperClass } from 'swiper/react'
import { SwiperSlide } from 'swiper/react'

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
        <div
          ref={prevElRef}
          onClick={() => swiperRef.current?.slidePrev()}
          className={`absolute z-10 h-full w-12 left-0 top-0 bg-gradient-to-l from-transparent to-black opacity-100 flex items-center transition-opacity duration-300 cursor-pointer group`}
        >
          <ChevronLeftRounded
            fontSize="large"
            className="text-gray-300 group-hover:scale-125 group-hover:text-gray-200 !w-12"
          />
        </div>

        <Swiper
          ref={swiperRef}
          onBeforeInit={(swiper: SwiperClass) => {
            swiperRef.current = swiper
          }}
          onInit={(swiper: SwiperClass) => {
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
              // navigation: {
              // enabled: true,
              // prevEl: prevElRef?.current,
              // nextEl,
              // disabledClass: '!opacity-0',
              // }
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
          // onSliderMove={(swiper: SwiperClass) => {
          //   {/* //@todo: get rid of this by providing custom navigation elements that contains the gradient edges */}
          //   console.log('move', swiper.realIndex, swiper.snapIndex, swiper)
          //   if (swiper.isEnd || swiper.realIndex === slides.length) {
          //     console.log('reached end')
          //     setLastSlideActive(true)
          //   } else {
          //     setLastSlideActive(false)
          //   }
          //
          //   if (swiper.translate === 0) {
          //     console.log('reached beginning')
          //     setFirstSlideActive(true)
          //   }
          //
          //   if (!swiper.isEnd) {
          //     setLastSlideActive(false)
          //   }
          //   if (!swiper.isBeginning) {
          //     setFirstSlideActive(false)
          //   }
          // }}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className="lg:max-w-[300px]">
              {slide}
            </SwiperSlide>
          ))}
        </Swiper>
        <div
          ref={nextElRef}
          onClick={() => swiperRef.current?.slideNext()}
          className={`absolute z-10 h-full w-12 right-0 top-0 bg-gradient-to-r from-transparent to-black opacity-100 cursor-pointer flex items-center transition-opacity duration-300 group`}
        >
          <ChevronRightRounded
            fontSize="large"
            className="text-gray-300 group-hover:scale-125 group-hover:text-gray-200 !w-12"
          />
        </div>
      </div>
    </div>
  )
}

export default HorizontalSwiper
