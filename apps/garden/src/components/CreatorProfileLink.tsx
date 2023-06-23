import { truncatedAddress } from '@/lib/address'
import { Avatar } from 'antd'
import Link from 'next/link'
import React from 'react'

const CreatorProfileLink = ({
  creatorId,
  hovered,
}: {
  creatorId: string
  hovered: boolean
}) => {
  const truncatedId = truncatedAddress(creatorId)

  return (
    <Link
      href={{
        pathname: `/creators/${creatorId}`,
      }}
      style={{
        textDecoration: hovered ? 'underline' : 'unset',
      }}
      className="flex items-center text-white mr-2"
    >
      <Avatar size={50} className="mr-2" />
      <div className="text-sm font-bold overflow-hidden whitespace-nowrap">
        {truncatedId}
      </div>
    </Link>
  )
}

export default CreatorProfileLink
