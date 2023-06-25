import ProfileAvatar from '@/components/ProfileAvatar'
import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const MyProfileButton = () => {
  const { address } = useContext(UserContext)

  return (
    <Link href="/me" passHref>
      <Button type="text" className="flex justify-center px-2 h-full">
        <ProfileAvatar seed={address || ''} />
      </Button>
    </Link>
  )
}

export default MyProfileButton
