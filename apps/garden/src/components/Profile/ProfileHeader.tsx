import FollowControls from '@/components/FollowControls'
import ProfileAvatar from '@/components/Profile/ProfileAvatar'
import ProfileHeaderName from '@/components/Profile/ProfileHeaderName'
import React from 'react'

const ProfileHeader = ({
  creatorId,
  creatorDisplayName,
  // isConnectedUser,
  numCreations,
}: {
  creatorId: string
  creatorDisplayName: string
  isConnectedUser: boolean
  numCreations: number | undefined
}) => {
  return (
    <div className="flex flex-col border border-solid border-gray-300 dark:border-gray-900 rounded-lg p-4 relative">
      <div className="flex w-full items-center justify-start gap-4">
        <div className="flex h-full flex-shrink-0 w-min">
          <ProfileAvatar seed={creatorId} />
        </div>
        <div className="flex flex-col justify-center w-full min-w-0">
          <ProfileHeaderName
            // isOwnProfile={isConnectedUser}mm
            displayName={creatorDisplayName}
          />
          <div className="">
            <div className="text-sm mt-1">
              <strong>{numCreations || 0}</strong> Creations
            </div>
            <div className="col-span-full sm:col-span-1">
              <FollowControls creatorId={creatorId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
