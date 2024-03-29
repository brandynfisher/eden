import ArrowRight from '@mui/icons-material/ArrowRight'
import Link from 'next/link'
import React, { ReactNode, useState } from 'react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import { A11y, Navigation, Pagination, Scrollbar } from 'swiper/modules'
// import ScrollContainer from 'react-indiana-drag-scroll'
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
  const [firstSlideActive, setFirstSlideActive] = useState(true)
  const [lastSlideActive, setLastSlideActive] = useState(false)
  return (
    <div className="mb-4">
      <div className="flex justify-between flex-wrap items-center">
        <h2 className="mb-2">{title}</h2>
        <Link title={'Show all'} href={url} className="flex items-center">
          Show all <ArrowRight />
        </Link>
      </div>
      {/*<ScrollContainer*/}
      {/*  vertical={false}*/}
      {/*  horizontal={true}*/}
      {/*  hideScrollbars={false}*/}
      {/*  className="grid gap-4 grid-rows-1 grid-flow-col pb-4 after:content-[''] snap-x snap-mandatory"*/}
      {/*  style={{ gridAutoColumns: 'minmax(300px, 450px)' }}*/}
      {/*>*/}
      {/*  {children}*/}
      {/*</ScrollContainer>*/}

      <div className="relative">
        <div
          className={`absolute z-10 h-full w-12 left-0 top-0 bg-gradient-to-l from-transparent to-black pointer-events-none opacity-0 flex items-center transition-opacity duration-300 ${
            !firstSlideActive ? 'opacity-100' : ''
          }`}
        />
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={16}
          scrollbar={{
            hide: false,
          }}
          navigation={{
            enabled: false,
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
                enabled: true,
              },
            },
            512: {
              slidesPerView: 2.25,
              pagination: {
                enabled: true,
                clickable: true,
              },
              navigation: {
                enabled: true,
              },
            },
            768: {
              slidesPerView: 3.25,
              pagination: {
                enabled: true,
                clickable: true,
              },
              navigation: {
                enabled: true,
              },
            },
            1024: {
              slidesPerView: 'auto',
              pagination: {
                enabled: false,
              },
              navigation: {
                enabled: true,
              },
            },
          }}
          onSliderMove={(swiper: SwiperClass) => {
            console.log('move', swiper.realIndex, swiper.snapIndex, swiper)
            if (swiper.isEnd || swiper.realIndex === slides.length) {
              console.log('reached end')
              setLastSlideActive(true)
            } else {
              setLastSlideActive(false)
            }

            if (swiper.translate === 0) {
              console.log('reached beginning')
              setFirstSlideActive(true)
            }

            if (!swiper.isEnd) {
              setLastSlideActive(false)
            }
            if (!swiper.isBeginning) {
              setFirstSlideActive(false)
            }
          }}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className="lg:max-w-[300px]">
              {slide}
            </SwiperSlide>
          ))}
        </Swiper>
        <div
          className={`absolute z-10 h-full w-12 right-0 top-0 bg-gradient-to-r from-transparent to-black pointer-events-none opacity-0 flex items-center transition-opacity duration-300 ${
            !lastSlideActive ? 'opacity-100' : ''
          }`}
        />
      </div>
    </div>
  )
}

export default HorizontalSwiper
