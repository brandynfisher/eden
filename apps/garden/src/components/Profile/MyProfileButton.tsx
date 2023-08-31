import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import LoadingIndicator from '@/components/LoadingIndicator'
import { UserContext } from '@/providers/UserProvider'
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const MyProfileButton = () => {
  const { userId, user, isAuthenticated, authenticate } =
    useContext(UserContext)

  const userProfilePath =
    isAuthenticated && user && user.username
      ? `/creators/${user.username?.toLowerCase()}`
      : ''

  return (
    <div className="flex rounded items-center">
      <ClerkLoading>
        <LoadingIndicator />
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>
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
        </SignedIn>
        <SignedOut>
          <Button type="primary" onClick={() => authenticate()}>
            Log in
          </Button>
        </SignedOut>
      </ClerkLoaded>
    </div>
  )
}

export default MyProfileButton
