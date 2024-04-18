import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import HorizontalSwiper from '@/components/Swiper/HorizontalSwiper/HorizontalSwiper'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

const FeaturedModelsSwiper = ({ models }: { models: Concept[] }) => {
  if (!models) {
    return null
  }

  return (
    <HorizontalSwiper
      title={'Featured Models'}
      url={'/concepts'}
      freeMode={true}
      slideClasses={'max-w-[300px]'}
      slides={models.map((item, index) => (
        <ConceptCard
          key={index}
          data={item}
          index={index}
          lazyLoad={index > 2}
        />
      ))}
    />
  )
}

export default FeaturedModelsSwiper
