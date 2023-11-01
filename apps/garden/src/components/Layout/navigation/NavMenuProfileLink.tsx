import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import Link from 'next/link'
import React from 'react'

const NavMenuProfileLink = ({
  userId,
  username,
  userImage,
}: {
  userId: string | null
  username: string | undefined
  userImage: string | undefined
}) => {
  return (
    <Link
      href={username ? `/creators/${username?.toLowerCase()}` : '/'}
      passHref
      className="font-mono flex justify-center items-center h-[32px] w-[32px] mr-2"
    >
      <CharacterAvatar
        id={userId || ''}
        name={username || ''}
        imageUri={userImage || ''}
        size={'small'}
        shape="circle"
      />
    </Link>
  )
}

export default NavMenuProfileLink
