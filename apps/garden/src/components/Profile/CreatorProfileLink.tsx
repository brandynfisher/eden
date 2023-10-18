import CreatorProfileButton from '@/components/Profile/CreatorProfileButton'
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
          : 'hover:text-gray-800 text-black dark:text-gray-300'
      }  hover:brightness-125 transition-all`}
    >
      <CreatorProfileButton
        creatorName={creatorName || ''}
        creatorId={creatorId}
        creatorImage={creatorImage || ''}
      />
    </Link>
  )
}

export default CreatorProfileLink
