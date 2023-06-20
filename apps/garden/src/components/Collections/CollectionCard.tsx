import { Collection } from '@eden-labs/eden-sdk'
import { Card } from 'antd'
import React from 'react'

const CollectionCard = ({ collection }: { collection: Collection }) => {
  return (
    <Card
      hoverable
      cover={<img alt="example" src={collection.displayThumbnail} />}
    >
      <Card.Meta
        title={collection.name}
        description={`${collection.creations?.length || 0} items`}
      />
    </Card>
  )
}

export default CollectionCard
