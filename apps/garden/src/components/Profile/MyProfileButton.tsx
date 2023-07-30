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
        className="font-mono flex justify-center px-2 h-full items-center"
        onClick={() => authenticate()}
        loading={isAuthenticating ? { delay: 250 } : false}
        disabled={isAuthenticating}
      >
        Sign In
      </Button>
    )
  }

  return (
    <Link href="/me" passHref>
      <div className="flex justify-center">
        <CharacterAvatar
          id={address || ''}
          name={(user && user?.username) || ''}
          imageUri={(user && user?.userImage) || ''}
          size={'small'}
        />
      </div>
    </Link>
  )
}

export default MyProfileButton
