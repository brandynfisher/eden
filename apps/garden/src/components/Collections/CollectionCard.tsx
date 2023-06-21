import { Collection } from '@eden-labs/eden-sdk'
import { Card } from 'antd'
import Link from 'next/link'
import React from 'react'

const CollectionCard = ({ collection }: { collection: Collection }) => {
  return (
    <Link href={`/collections/${collection.id}`}>
      <Card
        hoverable
        cover={<img alt="example" src={collection.displayThumbnail} />}
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
