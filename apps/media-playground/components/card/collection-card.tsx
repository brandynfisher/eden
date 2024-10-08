import CollectionActionsMenu from '@/components/button/collection-actions-menu'
import CardFooter from '@/components/card/components/card-footer'
import CardImage from '@/components/card/components/card-image'
import { Card } from '@/components/ui/card'
import { CollectionV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { LockIcon, SquareMousePointerIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  collection: CollectionV2
  queryKey: QueryKey
  onClick?: (item: CollectionV2) => void
}

const CollectionCard = ({ collection, queryKey, onClick }: Props) => {
  return (
    <Card className="relative overflow-hidden border-0 z-10 transition-shadow hover:shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712] group">
      {!collection.public ? (
        <LockIcon className="absolute h-4 w-4 right-3 top-3.5 text-white [@media(pointer:coarse)]:right-2 [@media(pointer:coarse)]:top-2.5 bg-gray-300 bg-opacity-20 rounded-sm p-0.5 drop-shadow backdrop-blur-[2px] z-20" />
      ) : null}
      {onClick ? (
        <div
          className="absolute inset-0 flex items-center justify-center w-full h-full cursor-pointer hover:ring-2 ring-offset-1 ring-primary-foreground z-50 opacity-0 bg-popover group-hover:opacity-50 [@media(pointer:coarse)]:opacity-50 transition-all"
          onClick={() => onClick(collection)}
        >
          <SquareMousePointerIcon className="mr-2 h-4 w-4" />
          Select
        </div>
      ) : null}
      <Link
        href={`/collections/${collection._id}`}
        prefetch={false}
        className="relative w-full block"
      >
        <CardImage
          media={{
            url: collection.coverCreation?.thumbnail,
            thumbnail: collection.coverCreation?.thumbnail,
            width: 256,
            height: 256,
            type: 'image',
          }}
        />
      </Link>
      <CardFooter
        actions={[
          <CollectionActionsMenu
            key={1}
            collection={collection}
            queryKey={queryKey}
          />,
        ]}
      >
        <div className="text-xs">{collection.name}</div>
      </CardFooter>
    </Card>
  )
}

export default CollectionCard
