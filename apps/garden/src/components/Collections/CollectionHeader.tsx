import { truncatedAddress } from '@/lib/string'
import { UserContext } from '@/providers/UserProvider'
import { Collection } from '@edenlabs/eden-sdk'
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
  const truncatedId = truncatedAddress(collection.creatorId || '')
  return (
    <div className="flex flex-col bg-gray-200 dark:bg-gray-900 rounded-lg p-4 relative">
      <div className="flex w-full items-center justify-start gap-4">
        <div>
          <h2 className="dark:text-white text-lg font-semibold">
            {collection.name}
          </h2>
          <p className="dark:text-white text-md font-semibold">
            {collection.description}
          </p>
          <p className="dark:text-white text-sm">
            Curated by{' '}
            <Link href={`/creators/${collection.creatorId}`}>
              <span className="dark:text-white text-sm font-semibold">
                {' '}
                {truncatedId}
              </span>
            </Link>
          </p>
          <p className="dark:text-white text-sm">
            {collection.creations?.length || 0} Creations
          </p>
          {isAuthenticated && isAuthUser && !collection.isDefaultCollection && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-4">
              <Button
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
