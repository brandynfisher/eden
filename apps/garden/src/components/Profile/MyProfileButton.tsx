import ConnectButton from '@/components/ConnectButton'
import ProfileAvatar from '@/components/Profile/ProfileAvatar'
import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const MyProfileButton = () => {
  const {
    address,
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
        className="flex justify-center px-2 h-full items-center"
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
      <Button type="text" className="flex justify-center px-2 h-full">
        <ProfileAvatar seed={address || ''} />
      </Button>
    </Link>
  )
}

export default MyProfileButton
