import CreatorCard from '@/components/Creators/CreatorCard'
import HorizontalSwiper from '@/components/Swiper/HorizontalSwiper/HorizontalSwiper'
import { Creator } from '@edenlabs/eden-sdk'
import React from 'react'

const FeaturedArtistsSwiper = ({ creators }: { creators: Creator[] }) => {
  return (
    <HorizontalSwiper
      title={'Featured Artists'}
      url={'/creators'}
      freeMode={true}
      slideClasses={'max-w-[300px]'}
      slides={creators.map((item, index) => (
        <CreatorCard key={index} data={item} index={index} lazyLoad={true} />
      ))}
    />
  )
}

export default FeaturedArtistsSwiper
