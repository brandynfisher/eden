import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import { useFeaturedConcepts } from '@/hooks/useFeaturedConcepts'
import HorizontalSwiper from '@/pages/new/HorizontalSwiper'
import { Skeleton } from '@mui/material'
import React from 'react'

const FeaturedModelsSwiper = () => {
  const { concepts, isLoading } = useFeaturedConcepts()

  return (
    <HorizontalSwiper
      title={'Featured Models'}
      url={'/concepts'}
      slides={(isLoading ? Array.from(new Array(10)) : concepts || []).map(
        (item, index) => (
          <div key={index}>
            {item ? (
              <ConceptCard data={item} index={index} />
            ) : (
              <Skeleton
                variant="rectangular"
                className="!h-full !w-full rounded-lg aspect-square"
              />
            )}
          </div>
        ),
      )}
    />
  )
}

export default FeaturedModelsSwiper
