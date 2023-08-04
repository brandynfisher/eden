import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { timeAgo } from '@/lib/time'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const CreationCardDetail = ({
  creation,
  isOverlay,
}: {
  creation: Creation
  isOverlay?: boolean
}) => {
  const timeSinceCreation = timeAgo(creation.createdAt)

  return (
    <div className="flex items-center relative p-2">
      <div className="absolute inset-0 bg-gray-800 opacity-80 rounded-md" />
      <div className="z-10 w-full">
        <div className="flex justify-between mb-1">
          <div className="text-sm font-bold text-white">
            /{creation.task.generator?.generatorName}
          </div>
          <div
            className="text-gray-400 text-xs"
            title={new Date(creation.createdAt).toLocaleString()}
          >
            {timeSinceCreation}
          </div>
        </div>

        <div
          title={creation.name}
          className="relative first-letter:uppercase text-xs select-text  cursor-text mb-2 w-full text-ellipsis text-gray-300 break-words line-clamp-2"
        >
          {creation.name}
        </div>
        <CreatorProfileLink
          creatorId={creation.user.userId}
          creatorName={creation.user.username}
          creatorImage={creation.user.userImage}
          isOverlay={isOverlay}
        />
      </div>
    </div>
  )
}

export default CreationCardDetail
