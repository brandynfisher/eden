import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import ConnectButton from '@/components/ConnectButton'
import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const MyProfileButton = () => {
  const {
    address,
    user,
    isConnected,
    isAuthenticated,
    authenticate,
    isAuthenticating,
  } = useContext(UserContext)

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
    <Link
      href={userProfilePath}
      passHref
      className="font-mono flex justify-center px-2 h-full items-center h-[32px] w-[32px] max-h-full"
    >
      <Button type="text" className="flex justify-center px-2">
        <CharacterAvatar
          id={address || ''}
          name={(user && user?.username) || ''}
          imageUri={(user && user?.userImage) || ''}
          size={'small'}
        />
      </Button>
    </Link>
  )
}

export default MyProfileButton
