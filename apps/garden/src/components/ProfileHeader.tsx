import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import React, { useContext } from 'react'

const ProfileHeader = ({
  creatorDisplayName,
  numCreations,
  followerCount,
  followingCount,
  isAuthUser,
  isFollowingUser,
  onFollowButtonClick,
  followLoading,
}: {
  creatorDisplayName: string
  numCreations: number | undefined
  followerCount: number | undefined
  followingCount: number | undefined
  isAuthUser: boolean
  isFollowingUser: boolean
  onFollowButtonClick: () => void
  followLoading: boolean
}) => {
  const { isAuthenticated } = useContext(UserContext)
  return (
    <div className="flex items-center bg-blue-500 dark:bg-gray-900 rounded-lg p-4 relative">
      <div className="flex-shrink-0 mr-4">
        <div className="h-12 w-12 rounded-full bg-white"></div>
      </div>
      <div>
        <div>
          <div className="overflow-x-hidden">
            <h2
              className="text-white text-lg font-semibold truncate"
              title={creatorDisplayName}
            >
              {creatorDisplayName}
            </h2>
          </div>
          <Button>Edit</Button>
        </div>

        <p className="text-white text-sm">{numCreations || 0} Creations</p>
        <div className="flex mt-2">
          <div className="mr-4">
            <p className="text-white text-sm">{followerCount || 0} Followers</p>
          </div>
          <div className="mr-4">
            <p className="text-white text-sm">
              {followingCount || 0} Following
            </p>
          </div>
        </div>
      </div>
      {isAuthenticated && !isAuthUser && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-4">
          <Button
            type="primary"
            onClick={onFollowButtonClick}
            loading={followLoading}
          >
            {isFollowingUser ? 'Following' : 'Follow'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ProfileHeader
