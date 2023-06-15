import CreationCard from '@/components/CreationCard/CreationCard'
import { Creation } from '@eden-labs/eden-sdk'
import { Masonry } from 'masonic'
import React from 'react'

const CreationMasonry = ({ creations }: { creations: Creation[] }) => {
  return (
    <div className="w-full">
      <Masonry
        items={creations}
        columnCount={4}
        columnGutter={2}
        overscanBy={5}
        render={CreationCard}
      />
    </div>
  )
}

export default CreationMasonry
