import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import { truncatedAddress } from '@/lib/string'
import React from 'react'

const CreatorProfileButton = ({
  creatorId,
  creatorName,
  creatorImage,
}: {
  creatorId: string
  creatorName: string
  creatorImage?: string
}) => {
  return (
    <div
      className={`creator-profile-link flex items-stretch max-w-full hover:text-gray-800 text-black dark:text-gray-300 hover:brightness-125 transition-all`}
    >
      {creatorImage ? (
        <div className="flex mr-2 items-center justify-center h-[28px] w-[28px] flex-shrink-0 rounded-full overflow-hidden">
          <CharacterAvatar
            id={creatorId}
            name={creatorName || ''}
            imageUri={creatorImage || ''}
            size={'small'}
          />
        </div>
      ) : null}
      <div
        className="creator-profile-link-name text-xs font-bold overflow-hidden whitespace-nowrap self-center truncate"
        title={creatorName || ''}
      >
        {creatorName && (
          <>
            {creatorName.length > 32
              ? truncatedAddress(creatorName)
              : creatorName}
          </>
        )}
      </div>
    </div>
  )
}

export default CreatorProfileButton
