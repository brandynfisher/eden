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
      <div className="flex w-full items-center justify-start gap-4">
        <div className="flex h-full flex-shrink-0 w-min">
          <ProfileAvatar seed={creatorId} />
        </div>
        <div className="flex flex-col justify-center w-full min-w-0">
          <ProfileHeaderName
            isOwnProfile={isAuthenticated && isAuthUser}
            displayName={creatorDisplayName}
          />
          <div className="text-sm mt-1">
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
