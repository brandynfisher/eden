import CollectionDescription from '@/components/Collections/CollectionDescription'
import CollectionName from '@/components/Collections/CollectionName'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { UserContext } from '@/providers/UserProvider'
import { Collection } from '@edenlabs/eden-sdk'
import { ConnectedTvOutlined } from '@mui/icons-material'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const CollectionHeader = ({
  collection,
  isAuthUser,
  onDeleteButtonClick,
  deleteLoading,
}: {
  collection: Collection
  isAuthUser: boolean
  onDeleteButtonClick: () => void
  deleteLoading: boolean
}) => {
  const { isAuthenticated } = useContext(UserContext)
  return (
    <div className="flex flex-col bg-gray-200 dark:bg-gray-900 rounded-lg p-4 relative">
      <div className="flex w-full items-center justify-start gap-4">
        <div>
          <CollectionName
            collectionId={collection._id}
            isOwnProfile={isAuthUser}
          />
          <CollectionDescription
            collectionId={collection._id}
            isOwnProfile={isAuthUser}
          />

          <div className="dark:text-gray-400 text-sm">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div>Curated by </div>
              <div className="mt-1">
                <CreatorProfileLink
                  creatorId={collection.creatorId || ''}
                  creatorName={collection.creatorName || ''}
                  creatorImage={collection.creatorImage || ''}
                />
              </div>
            </div>
            <div>{collection.creations?.length || 0} Creations</div>
          </div>
          {isAuthenticated && isAuthUser && !collection.isDefaultCollection && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-4">
              <Button
                className="font-mono"
                type="dashed"
                danger
                onClick={onDeleteButtonClick}
                loading={deleteLoading}
              >
                Delete Collection
              </Button>
            </div>
          )}
        </div>
      </div>
      <Link
        title={'Opens page in new tab'}
        href={`/channels?collectionId=${collection._id}`}
        target="_blank"
        className="mt-2"
      >
        <Button className="flex items-center gap-2 justify-between">
          <ConnectedTvOutlined fontSize="small" />
          <div>Play in New Tab</div>
        </Button>
      </Link>
    </div>
  )
}

export default CollectionHeader
