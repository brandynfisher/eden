import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { Creator } from '@edenlabs/eden-sdk'
import { People } from '@mui/icons-material'
import Yard from '@mui/icons-material/Yard'
import { Popover, Tag } from 'antd'
import Link from 'next/link'
import React, { useContext, useEffect } from 'react'

const CreatorCardFooter = ({ creator }: { creator: Creator }) => {
  const { showModal } = useModalContext()
  const { isAuthenticated, userId } = useContext(UserContext)
  const [isOwnProfile, setIsOwnProfile] = React.useState(false)

  useEffect(() => {
    setIsOwnProfile(isAuthenticated && userId === creator._id)
  }, [isAuthenticated, userId, creator])

  const onFollowersClickHandler = () => {
    showModal(MODAL_TYPES.FOLLOWERS_MODAL, {
      creatorId: creator.userId,
      isOwnProfile,
    })
  }

  return (
    <>
      <Popover content="Creations made by this user" trigger={['hover']}>
        <Link href={`/creators/${creator.username}`}>
          <Tag
            className={`flex items-center first-letter:capitalize me-0 gap-1 bg-gray-300 dark:bg-gray-800 hover:text-blue-400 px-1 ${
              !creator.creationCount ? 'text-gray-500' : ''
            }`}
            bordered={false}
            icon={<Yard fontSize="medium" />}
          >
            {creator.creationCount || 0}
          </Tag>
        </Link>
      </Popover>

      <Popover content="Followers" trigger={['hover']}>
        <Tag
          className={`flex cursor-pointer items-center first-letter:capitalize me-0 gap-1 bg-gray-300 dark:bg-gray-800 hover:text-blue-400 px-1 ${
            creator.followerCount === 0 ? 'text-gray-500' : ''
          }`}
          bordered={false}
          icon={<People fontSize="medium" />}
          onClick={() => onFollowersClickHandler()}
        >
          {creator.followerCount || 0}
        </Tag>
      </Popover>
    </>
  )
}

export default CreatorCardFooter
