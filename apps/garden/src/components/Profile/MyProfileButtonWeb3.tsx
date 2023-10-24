import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import ConnectButton from '@/components/Layout/buttons/ConnectButton'
import { useWeb3State } from '@/hooks/auth/useWeb3State'
import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

export const MyProfileButtonWeb3 = () => {
  const { isConnected } = useWeb3State()
  const { userId, user, isAuthenticated, authenticate, isAuthenticating } =
    useContext(UserContext)

  if (!isConnected) {
    return <ConnectButton />
  }

  if (!isAuthenticated) {
    return (
      <Button
        type="primary"
        onClick={() => authenticate()}
        loading={isAuthenticating ? { delay: 250 } : false}
        disabled={isAuthenticating}
      >
        Sign In
      </Button>
    )
  }

  const userProfilePath =
    isAuthenticated && user && user.username
      ? `/creators/${user.username?.toLowerCase()}`
      : ''

  return (
    <div>
      <Link
        href={userProfilePath}
        passHref
        className="font-mono flex justify-center items-center h-[32px] w-[32px] flex-shrink-0 flex-grow max-h-full hover:brightness-125 transition-all duration-200 nav-profile-image rounded-full overflow-hidden"
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

export default MyProfileButtonWeb3
