'use client'

import {
  OrderByFeatured,
  OrderByLatest,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import FeaturedSectionHeader from '@/components/Swiper/HorizontalSwiper/FeaturedSectionHeader'
import React from 'react'

const CreationsFeaturedFeed = () => {
  const filters = process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID
    ? [OrderByFeatured]
    : []

  return (
    <div>
      <FeaturedSectionHeader title={'Featured Creations'} url={'/creations'} />
      <div className={`flex flex-col`}>
        <MasonryInfiniteContainer
          itemType="creation"
          orderParams={filters}
          fallbackOrderParam={OrderByLatest}
          query={{ limit: 35 }}
          disableFilters={true}
        />
      </div>
    </div>
  )
}

export default CreationsFeaturedFeed
