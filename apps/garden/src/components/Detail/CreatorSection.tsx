import FollowControls from '@/components/FollowControls'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { useCreator } from '@/hooks/useCreator'
import { Creator } from '@edenlabs/eden-sdk'
import React from 'react'

const CreatorSection = ({
  user,
  showFollowControls,
}: {
  user: Creator
  showFollowControls?: boolean
}) => {
  const { creator } = useCreator(user._id)
  return (
    <div className="mb-2 col-span-4 xl:col-span-12 flex gap-2 min-w-0 px-2 py-2 border border-gray-300 dark:border-gray-800 border-solid bg-gray-100 dark:bg-gray-900 rounded-lg justify-between">
      <div className="overflow-hidden flex items-center flex-shrink-0 flex-grow max-w-full">
        <CreatorProfileLink
          creatorId={user?.userId}
          creatorName={user?.username}
          creatorImage={user?.userImage || ''}
        />
      </div>
      {showFollowControls && (
        <div className="flex items-center flex-shrink-0">
          <FollowControls
            creator={creator || undefined}
            creatorId={user._id}
            showStats={false}
          />
        </div>
      )}
    </div>
  )
}

export default CreatorSection
