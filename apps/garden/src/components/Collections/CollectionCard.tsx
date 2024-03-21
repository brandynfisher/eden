import { Collection } from '@edenlabs/eden-sdk'
import Groups from '@mui/icons-material/Groups'
import Chip from '@mui/material/Chip'
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
      wrapperClassName="!flex justify-center items-center overflow-hidden"
      className="object-cover w-full !h-full"
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
          description={
            <div className="flex flex-wrap items-center justify-between">
              {collection.creations?.length || 0} items{' '}
              {collection.contributors && collection.contributors.length ? (
                <Chip
                  size="small"
                  className="text-gray-400"
                  clickable={true}
                  label={
                    <div className="flex items-center gap-1">
                      <Groups fontSize="small" /> Shared
                    </div>
                  }
                />
              ) : null}
            </div>
          }
        />
      </Card>
    </Link>
  )
}

export default CollectionCard
