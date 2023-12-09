import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import MasonryInfiniteScrollable from '@/components/Masonry/MasonryInfiniteScrollable'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

const ConceptCreations = ({ concept }: { concept: Concept }) => {
  return (
    <div className="mt-2">
      <div className="px-2 mb-2 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between">
        <div className="my-2 text-gray-400 text-xs">Latest Creations</div>
        <MasonryInfiniteScrollable
          itemType="creation"
          ItemComponent={CreationCard}
          query={{ conceptId: concept._id }}
          // onCardClick={concept => onChange(concept as Concept)}
        />
      </div>
    </div>
  )
}

export default ConceptCreations
