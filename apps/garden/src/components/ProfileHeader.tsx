import FollowControls from '@/components/FollowControls'
import ProfileAvatar from '@/components/ProfileAvatar'
import ProfileHeaderName from '@/components/ProfileHeaderName'
import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const ProfileHeader = ({
  creatorId,
  creatorDisplayName,
  isAuthUser,
  numCreations,
}: {
  creatorId: string
  creatorDisplayName: string
  isAuthUser: boolean
  numCreations: number | undefined
}) => {
  const { isAuthenticated } = useContext(UserContext)
  return (
    <div className="flex flex-col bg-gray-200 dark:bg-gray-900 rounded-lg p-4 relative">
      <div className="flex items-center">
        <div className="flex h-full flex-shrink-0 mr-4 w-min">
          <ProfileAvatar seed={creatorId} />
        </div>
        <div className="flex flex-col justify-center w-full">
          <div className="mb-2">
            <ProfileHeaderName
              isOwnProfile={isAuthenticated && isAuthUser}
              displayName={creatorDisplayName}
            />
          </div>
          <div className="text-sm">
            <strong>{numCreations || 0}</strong> Creations
          </div>
        </div>
      </div>
      <div className="col-span-full sm:col-span-1">
        <FollowControls creatorId={creatorId} />
      </div>
    </div>
  )
}

export default ProfileHeader
