import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import { UserContext } from '@/providers/UserProvider'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import React, { useContext } from 'react'

const MyProfileButton = () => {
  const { userId, user, isAuthenticated } = useContext(UserContext)

  const userProfilePath =
    isAuthenticated && user && user.username
      ? `/creators/${user.username?.toLowerCase()}`
      : ''

  return (
    <div className="flex rounded border-solid border-gray-700">
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>

      <Link
        href={userProfilePath}
        passHref
        className="font-mono flex justify-center items-center h-[32px] w-[32px] flex-shrink-0 flex-grow max-h-full hover:brightness-125 transition-all duration-200 nav-profile-image"
      >
        <CharacterAvatar
          id={userId || ''}
          name={(user && user?.username) || ''}
          imageUri={(user && user?.userImage) || ''}
          size={'small'}
        />
      </Link>
    </div>
  )
}

export default MyProfileButton
