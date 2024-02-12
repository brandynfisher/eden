import { Collection } from '@edenlabs/eden-sdk'
import { Card, Image } from 'antd'
import Link from 'next/link'
import React from 'react'

const CoverImage = ({ imageUri }: { imageUri: string | undefined }) => {
  if (!imageUri) {
    return <div className="image-placeholder w-full h-full min-h-full" />
  }

  return (
    <Image
      alt="example"
      src={imageUri}
      preview={false}
      placeholder={true}
      wrapperClassName="flex justify-center overflow-hidden"
      className="object-cover"
    />
  )
}

const CollectionCard = ({ collection }: { collection: Collection }) => {
  return (
    <Link href={`/collections/${collection._id}`} className="h-full link-card">
      <Card
        hoverable
        cover={<CoverImage imageUri={collection.displayImageUri} />}
        className="h-full flex flex-col justify-between "
      >
        <Card.Meta
          title={collection.name}
          description={`${collection.creations?.length || 0} items`}
        />
      </Card>
    </Link>
  )
}

export default CollectionCard
