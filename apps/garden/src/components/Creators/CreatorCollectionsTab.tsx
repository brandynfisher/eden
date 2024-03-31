import CollectionCard from '@/components/Collections/CollectionCard'
import { Collection } from '@edenlabs/eden-sdk'
import React from 'react'
import { KeyedMutator } from 'swr'

const CreatorCollectionsTab = ({
  collections,
  refetchCollections,
}: {
  collections: Collection[] | undefined
  refetchCollections: KeyedMutator<Collection>
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {collections &&
        collections.map(collection => (
          <CollectionCard
            key={collection._id}
            collection={collection}
            onChange={refetchCollections}
          />
        ))}
    </div>
  )
}

export default CreatorCollectionsTab
