import ProfileAvatar from '@/components/Profile/ProfileAvatar'
import { truncatedAddress } from '@/lib/address'
import Link from 'next/link'
import React from 'react'

const CreatorProfileLink = ({
  creatorId,
  creatorName,
  isOverlay,
}: {
  creatorId: string
  creatorName?: string
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
      className={`flex items-center mr-2 ${
        isOverlay ? 'text-gray-300' : 'text-gray-500 dark:text-gray-300'
      } hover:dark:text-white hover:underline`}
    >
      <ProfileAvatar seed={creatorId} />
      <div className="ml-2 text-sm font-bold overflow-hidden whitespace-nowrap">
        {creatorName && creatorName !== creatorId
          ? creatorName
          : truncatedAddress(creatorId)}
      </div>
    </Link>
  )
}

export default CreatorProfileLink
