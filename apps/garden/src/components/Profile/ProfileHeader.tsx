import FollowControls from '@/components/FollowControls'
import ProfileAvatar from '@/components/Profile/ProfileAvatar'
import ProfileHeaderName from '@/components/Profile/ProfileHeaderName'
import { LoadingOutlined } from '@ant-design/icons'
import { Creator } from '@edenlabs/eden-sdk'
import React, { useEffect, useState } from 'react'

const ProfileHeader = ({
  creatorId,
  creator,
  isConnectedUser,
  numCreations,
}: {
  creatorId: string
  creator: Creator | undefined
  isConnectedUser: boolean
  numCreations: number | undefined
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    setIsLoading(true)

    if (!creator) {
      return
    }

    if (creator.username) {
      setDisplayName(creator.username)
    } else {
      setDisplayName(creatorId)
    }

    setIsLoading(false)
  }, [creator, creatorId])

  return (
    <div className="flex flex-col border border-solid border-gray-300 dark:border-gray-900 rounded-lg p-4 relative">
      <div className="flex w-full items-center justify-start gap-4">
        <div className="flex h-full flex-shrink-0 w-min">
          <ProfileAvatar seed={creatorId} />
        </div>
        <div className="flex flex-col justify-center w-full min-w-0">
          {isLoading ? (
            <div>
              <LoadingOutlined />
            </div>
          ) : (
            <ProfileHeaderName
              isOwnProfile={isConnectedUser}
              displayName={displayName}
              setDisplayName={setDisplayName}
            />
          )}
          <div>
            <div className="text-sm my-1">
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
