import { truncatedAddress } from '@/lib/address'
import { Avatar } from 'antd'
import Link from 'next/link'
import React from 'react'

const CreatorProfileLink = ({ creatorId }: { creatorId: string }) => {
  const truncatedId = truncatedAddress(creatorId)

  return (
    <Link
      href={{
        pathname: `/creators/${creatorId}`,
      }}
      className="flex items-center mr-2 text-gray-400 hover:text-white hover:underline"
    >
      <Avatar size={50} className="mr-2" />
      <div className="text-sm font-bold overflow-hidden whitespace-nowrap">
        {truncatedId}
      </div>
    </Link>
  )
}

export default CreatorProfileLink
