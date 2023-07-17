import ProfileAvatar from '@/components/Profile/ProfileAvatar'
import { truncatedAddress } from '@/lib/string'
import Link from 'next/link'
import React from 'react'

const CreatorProfileLink = ({
  creatorId,
  isOverlay,
}: {
  creatorId: string
  isOverlay?: boolean
}) => {
  const truncatedId = truncatedAddress(creatorId)

  return (
    <Link
      onClick={ev => ev.stopPropagation()}
      href={{
        pathname: `/creators/${creatorId}`,
      }}
      className={`flex items-center mr-2 ${
        isOverlay ? 'text-gray-300' : 'text-gray-500 dark:text-gray-300'
      } hover:dark:text-white hover:underline`}
    >
      <ProfileAvatar seed={creatorId} />
      <div className="ml-2 text-sm font-bold overflow-hidden whitespace-nowrap">
        {truncatedId}
      </div>
    </Link>
  )
}

export default CreatorProfileLink
