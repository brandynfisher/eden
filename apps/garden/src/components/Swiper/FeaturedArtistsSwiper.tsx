import CreatorCard from '@/components/Creators/CreatorCard'
import HorizontalSwiper from '@/components/Swiper/HorizontalSwiper/HorizontalSwiper'
import SlideSkeleton from '@/components/Swiper/SlideSkeleton'
import { useFeaturedArtists } from '@/hooks/useFeaturedArtists'
import React from 'react'

const FeaturedArtistsSwiper = () => {
  const { creators, isLoading } = useFeaturedArtists()

  return (
    <HorizontalSwiper
      title={'Featured Artists'}
      url={'/creators'}
      slideClasses={'max-w-[300px]'}
      slides={(isLoading ? Array.from(new Array(10)) : creators || []).map(
        (item, index) => {
          return item ? (
            <CreatorCard key={index} data={item} index={index} />
          ) : (
            <SlideSkeleton key={index} />
          )
        },
      )}
    />
  )
}

export default FeaturedArtistsSwiper
