import CollectionCard from '@/components/Collections/CollectionCard'
import { Collection } from '@edenlabs/eden-sdk'
import React from 'react'

const CreatorCollectionsTab = ({
  collections,
}: {
  collections: Collection[] | undefined
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {collections &&
        collections.map(collection => (
          <CollectionCard key={collection._id} collection={collection} />
        ))}
    </div>
  )
}

export default CreatorCollectionsTab
