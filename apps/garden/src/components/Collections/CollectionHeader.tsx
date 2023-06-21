import { truncatedAddress } from '@/lib/address'
import { UserContext } from '@/providers/UserProvider'
import { Collection } from '@eden-labs/eden-sdk'
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
    <div className="flex items-center bg-blue-500 rounded-lg p-4 relative">
      <div className="flex-shrink-0 mr-4">
        <div className="h-12 w-12 rounded-full bg-white"></div>
      </div>
      <div>
        <h2 className="text-white text-lg font-semibold">{collection.name}</h2>
        <p className="text-white text-md font-semibold">
          {collection.description}
        </p>
        <p className="text-white text-sm">
          {collection.creations?.length || 0} Creations
        </p>
        <p className="text-white text-sm">
          Created by{' '}
          <Link href={`/creators/${collection.creatorId}`}>
            <span className="text-white text-sm font-semibold">
              {' '}
              {truncatedId}
            </span>
          </Link>
        </p>
        {isAuthenticated && isAuthUser && (
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
  )
}

export default CollectionHeader
