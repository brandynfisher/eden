import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import HorizontalSwiper from '@/components/Swiper/HorizontalSwiper'
import SlideSkeleton from '@/components/Swiper/SlideSkeleton'
import { useFeaturedConcepts } from '@/hooks/useFeaturedConcepts'
import React from 'react'

const FeaturedModelsSwiper = () => {
  const { concepts, isLoading } = useFeaturedConcepts()

  return (
    <HorizontalSwiper
      title={'Featured Models'}
      url={'/concepts'}
      slideClasses={'max-w-[300px]'}
      slides={(isLoading ? Array.from(new Array(10)) : concepts || []).map(
        (item, index) => {
          return item ? (
            <ConceptCard key={index} data={item} index={index} />
          ) : (
            <SlideSkeleton key={index} />
          )
        },
      )}
    />
  )
}

export default FeaturedModelsSwiper
