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
]

const swiperBreakpoints: SwiperOptions['breakpoints'] = {
  420: {
    slidesPerView: 1.25,
    navigation: {
      disabledClass: '!opacity-0 pointer-events-none',
    },
  },
  768: {
    slidesPerView: 2.25,
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

const HighlightsSwiper = () => {
  // const [isLoading, setIsLoading] = useState(true)
  // const [highlightItems, setHighlightItems] = useState()
  //
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const idsQuery = dummyItems
  //       .map(item => `conceptId=${item.conceptId}`)
  //       .join('&')
  //     const result = await fetch(`/api/concepts/${idsQuery}`)
  //     const jsonResponse = await result.json()
  //     setHighlightItems(jsonResponse)
  //     setIsLoading(false)
  //   }
  //
  //   fetchData()
  // }, [])

  return (
    <HorizontalSwiper
      title={'Highlights'}
      breakpoints={swiperBreakpoints}
      // slides={(isLoading ? Array.from(new Array(3)) : highlightItems || []).map(
      //   (item, index) => {
      //     return item ? (
      //       <HighlightCard key={index} concept={item} coverImageUri={item.coverImageUri} />
      //     ) : (
      //       <HighlightSlideSkeleton key={index} />
      //     )
      //   }
      // )}
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
