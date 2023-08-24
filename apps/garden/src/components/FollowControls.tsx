import { useCreator } from '@/hooks/useCreator'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useEffect } from 'react'

const FollowControls = ({ creatorId }: { creatorId: string }) => {
  const { message } = App.useApp()
  const [followLoading, setFollowLoading] = React.useState(false)
  const [followerCount, setFollowerCount] = React.useState(0)
  const [followingCount, setFollowingCount] = React.useState(0)
  const [isFollowingUser, setIsFollowingUser] = React.useState(false)
  const [isOwnProfile, setIsOwnProfile] = React.useState(false)

  const { creator } = useCreator(creatorId)
  const { isAuthenticated, userId } = useContext(UserContext)

  useEffect(() => {
    setFollowerCount(creator?.followerCount || 0)
    setIsFollowingUser(creator?.isFollowing || false)
    setFollowingCount(creator?.followingCount || 0)
    setIsOwnProfile(isAuthenticated && userId === creatorId)
  }, [isAuthenticated, creatorId, userId, creator])

  const onFollowButtonClick = async () => {
    setFollowLoading(true)
    if (isFollowingUser) {
      try {
        await axios.post(`/api/creators/unfollow`, {
          userId: userId,
        })
        setFollowerCount(followerCount - 1)
        setIsFollowingUser(!isFollowingUser)
      } catch (error) {
        handleAxiosError(error, message)
      }
    } else {
      try {
        await axios.post(`/api/creators/follow`, {
          userId: userId,
        })
        setFollowerCount(followerCount + 1)
        setIsFollowingUser(!isFollowingUser)
      } catch (error) {
        handleAxiosError(error, message)
      }
    }
    setFollowLoading(false)
  }

  return (
    <div className="flex dark:text-gray-400 items-center gap-2 justify-between flex-wrap">
      <div className="flex flex-shrink-0 gap-2">
        <div className="text-xs md:text-sm flex-shrink-0">
          <strong>{followerCount || 0}</strong> Followers
        </div>
        <div className="text-xs md:text-sm flex-shrink-0">
          <strong>{followingCount || 0}</strong> Following
        </div>
      </div>

      {isAuthenticated && !isOwnProfile && (
        <Button
          size="small"
          title={isFollowingUser ? 'Unfollow' : 'Follow'}
          type={isFollowingUser ? 'link' : 'default'}
          onClick={onFollowButtonClick}
          loading={followLoading ? { delay: 250 } : false}
          className={`font-mono flex-shrink-0 ${
            isFollowingUser ? '!px-0' : '!px-3'
          }`}
        >
          {isFollowingUser ? (
            <>
              <UserDeleteOutlined /> Following
            </>
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
