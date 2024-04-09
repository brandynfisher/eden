import { handleAxiosError } from '@/lib/fetcher'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import UserAddOutlined from '@ant-design/icons/UserAddOutlined'
import UserDeleteOutlined from '@ant-design/icons/UserDeleteOutlined'
import { Creator } from '@edenlabs/eden-sdk'
import { People } from '@mui/icons-material'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useEffect } from 'react'

const FollowControls = ({
  creator,
  creatorId,
  showStats,
}: {
  creatorId: string
  creator?: Creator
  showStats?: boolean
}) => {
  const { message } = App.useApp()
  const [followLoading, setFollowLoading] = React.useState(false)
  const [followerCount, setFollowerCount] = React.useState(0)
  const [followingCount, setFollowingCount] = React.useState(0)
  const [isFollowingUser, setIsFollowingUser] = React.useState(false)
  const [isOwnProfile, setIsOwnProfile] = React.useState(false)
  const { isAuthenticated, userId, maybeAuthenticate } = useContext(UserContext)

  const { showModal } = useModalContext()

  const onFollowersClickHandler = async () => {
    if (!(await maybeAuthenticate())) return
    showModal(MODAL_TYPES.FOLLOWERS_MODAL, {
      creatorId: creatorId,
      isOwnProfile,
      className: 'modal-small',
    })
  }

  const onFollowingClickHandler = async () => {
    if (!(await maybeAuthenticate())) return
    showModal(MODAL_TYPES.FOLLOWING_MODAL, {
      creatorId: creatorId,
      isOwnProfile,
      className: 'modal-small',
    })
  }

  useEffect(() => {
    setFollowerCount(creator?.followerCount || 0)
    setIsFollowingUser(creator?.isFollowing || false)
    setFollowingCount(creator?.followingCount || 0)
    setIsOwnProfile(isAuthenticated && userId === creatorId)
  }, [isAuthenticated, userId, creator, creatorId])

  const onFollowButtonClick = async () => {
    setFollowLoading(true)

    try {
      if (isFollowingUser) {
        await axios.post(`/api/creators/unfollow`, {
          userId: creatorId,
        })
        setFollowerCount(followerCount - 1)
      } else {
        await axios.post(`/api/creators/follow`, {
          userId: creatorId,
        })
        setFollowerCount(followerCount + 1)
      }
      setIsFollowingUser(!isFollowingUser)
    } catch (error) {
      handleAxiosError(error, message)
    }

    setFollowLoading(false)
  }

  return (
    <div className="flex dark:text-gray-400 gap-2 justify-between flex-wrap items-center h-full">
      {showStats && (
        <div className="flex flex-wrap gap-2">
          <div
            className="text-xs md:text-sm flex items-center gap-1 border border-solid border-gray-300 dark:border-gray-700 rounded px-1 flex-shrink-0 hover:brightness-125 cursor-pointer"
            onClick={() => onFollowersClickHandler()}
          >
            <People fontSize="medium" />
            <strong>{followerCount || 0}</strong>
            Followers
          </div>
          {isAuthenticated && isOwnProfile ? (
            <div
              className="text-xs md:text-sm flex items-center gap-1 border border-solid border-gray-300 dark:border-gray-700 rounded px-1 flex-shrink-0 hover:brightness-125 cursor-pointer"
              onClick={() => onFollowingClickHandler()}
            >
              <strong>{followingCount || 0}</strong> Following
            </div>
          ) : null}
        </div>
      )}

      {isAuthenticated && !isOwnProfile && (
        <Button
          size="small"
          title={isFollowingUser ? 'Unfollow' : 'Follow'}
          type={isFollowingUser ? 'link' : 'default'}
          onClick={onFollowButtonClick}
          loading={followLoading ? { delay: 250 } : false}
          className={`font-mono flex-shrink-0 overflow-hidden ${
            isFollowingUser ? '!px-0' : '!px-3'
          }`}
        >
          {isFollowingUser ? (
            <div className="hover:text-gray-700 hover:dark:text-gray-400">
              <UserDeleteOutlined /> Unfollow
            </div>
          ) : (
            <>
              <UserAddOutlined /> Follow
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default FollowControls
