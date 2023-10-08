import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { UserContext } from '@/providers/UserProvider'
import { Collection } from '@edenlabs/eden-sdk'
import { Button } from 'antd'
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
          <h2 className="dark:text-white text-lg font-semibold">
            Collection: {collection.name}
          </h2>
          <div className="dark:text-white text-md font-semibold mb-2">
            {collection.description}
          </div>

          <div className="dark:text-gray-400 text-sm">
            <div>{collection.creations?.length || 0} Creations</div>
            <div className="flex mt-2">
              <div>
                <div>Curated by </div>
                <div className="mt-1">
                  <CreatorProfileLink
                    creatorId={collection.creatorId || ''}
                    creatorName={collection.creatorName || ''}
                    creatorImage={collection.creatorImage || ''}
                  />
                </div>
              </div>
            </div>
          </div>
          {isAuthenticated && isAuthUser && !collection.isDefaultCollection && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-4">
              <Button
                className="font-mono"
                type="primary"
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
    </div>
  )
}

export default CollectionHeader
