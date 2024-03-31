import CardHeaderWrap from '@/components/Card/CardHeaderWrap'
import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import { CONFIG } from '@/lib/config'
import { Collection } from '@edenlabs/eden-sdk'
import Groups from '@mui/icons-material/Groups'
import LockIcon from '@mui/icons-material/Lock'
import Chip from '@mui/material/Chip'
import { Card, Image } from 'antd'
import Link from 'next/link'
import React, { useCallback, useState } from 'react'

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
      wrapperClassName="!flex justify-center items-center overflow-hidden h-full"
      className="object-cover w-full !h-full !rounded-none"
    />
  )
}

const CollectionCard = ({
  collection,
  onChange,
}: {
  collection: Collection
  onChange: () => void
}) => {
  const [itemData, setItemData] = useState(collection)

  const cardClickHandler = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault()
    // console.log(ev)
  }, [])

  const cardChangeHandler = (newItemData: Collection) => {
    setItemData(newItemData)
    onChange && onChange()
  }

  return (
    <Link href={`/collections/${itemData._id}`} className="h-full link-card">
      <Card
        onClick={cardClickHandler}
        hoverable
        cover={
          <div className="flex flex-col">
            <CardHeaderWrap title={itemData.name} onClick={cardClickHandler}>
              <>
                {itemData.isPrivate ? (
                  <LockIcon fontSize="small" className="text-white" />
                ) : null}
                <CardToolsDropdown
                  item={itemData}
                  itemType={'collection'}
                  onChange={updatedItem =>
                    cardChangeHandler(updatedItem as Collection)
                  }
                  pageUrl={`${CONFIG.NEXT_PUBLIC_HOST}/collections/${itemData._id}`}
                />
              </>
            </CardHeaderWrap>
            <CoverImage imageUri={itemData.displayImageUri} />
          </div>
        }
        className="h-full flex flex-col justify-between pointer-events-none"
      >
        <Card.Meta
          description={
            <div className="flex flex-wrap items-center justify-between">
              {itemData.creations?.length || 0} items{' '}
              {collection.contributors && collection.contributors.length ? (
                <Chip
                  size="small"
                  className="text-gray-400 pointer-events-auto"
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
