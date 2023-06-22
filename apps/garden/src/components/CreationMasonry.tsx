import CreationCard from '@/components/CreationCard/CreationCard'
import { Creation } from '@eden-labs/eden-sdk'
import { Masonry } from 'masonic'
import React from 'react'

const CreationMasonry = ({ creations }: { creations: Creation[] }) => {
  return (
    <div className="w-full">
      <Masonry
        items={creations}
        maxColumnCount={4}
        columnGutter={12}
        overscanBy={2}
        render={CreationCard}
        itemHeightEstimate={500}
      />
    </div>
  )
}

export default CreationMasonry
