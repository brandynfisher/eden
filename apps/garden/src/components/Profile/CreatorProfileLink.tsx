import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import { truncatedAddress } from '@/lib/string'
import Link from 'next/link'
import React from 'react'

const CreatorProfileLink = ({
  creatorId,
  creatorName,
  creatorImage,
  isOverlay,
}: {
  creatorId: string
  creatorName?: string
  creatorImage?: string
  isOverlay?: boolean
}) => {
  return (
    <Link
      onClick={ev => ev.stopPropagation()}
      href={{
        pathname: `/creators/${
          creatorName ? creatorName.toLowerCase() : creatorId
        }`,
      }}
      className={`creator-profile-link flex items-center items-stretch max-w-full ${
        isOverlay
          ? 'text-gray-300 hover:text-white'
          : 'hover:text-gray-800 text-gray-500 dark:text-gray-300'
      }  hover:brightness-125 transition-all`}
    >
      <div className="flex items-center justify-center h-[32px] w-[32px] flex-shrink-0">
        <CharacterAvatar
          id={creatorId}
          name={creatorName || ''}
          imageUri={creatorImage || ''}
          size={'small'}
        />
      </div>
      <div
        className="creator-profile-link-name ml-2 text-sm font-bold overflow-hidden whitespace-nowrap self-center truncate"
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
    </Link>
  )
}

export default CreatorProfileLink
