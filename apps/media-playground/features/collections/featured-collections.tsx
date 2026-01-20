'use client'

import CollectionCard from '@/components/card/collection-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCollectionQuery } from '@/hooks/query/use-collection-query'
import { env } from '@/lib/config'

const featuredCollectionIds =
  env.NEXT_PUBLIC_APP_ENV === 'production'
    ? [
        '6788f98dcb9cebf34e78cd66', // Gene's collection
        '678d9ae5d3d0be2aaaf83b27', // Xander's creatures
        '6792ace4dfae2e63e77e7cbb', // Agents
      ]
    : [
        '6788f98dcb9cebf34e78cd66',
        '678d9ae5d3d0be2aaaf83b27',
        '6792ace4dfae2e63e77e7cbb',
      ]

export const FeaturedCollections = () => {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {featuredCollectionIds.map(collectionId => (
        <FeaturedCollectionWrapper
          key={collectionId}
          collectionId={collectionId}
        />
      ))}
    </div>
  )
}

const FeaturedCollectionWrapper = ({
  collectionId,
}: {
  collectionId: string
}) => {
  const { collection, isLoading } = useCollectionQuery({
    key: collectionId,
    enabled: true,
  })

  if (isLoading) {
    return <Skeleton className="aspect-square w-full rounded-xl" />
  }

  if (!collection) {
    return null
  }

  return (
    <CollectionCard
      collection={collection}
      queryKey={['collections', collectionId]}
    />
  )
}
