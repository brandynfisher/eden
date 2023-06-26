import { useCreator } from '@/hooks/useCreator'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import axios from 'axios'
import React, { useContext, useEffect } from 'react'

const FollowControls = ({ creatorId }: { creatorId: string }) => {
  const [followLoading, setFollowLoading] = React.useState(false)
  const [followerCount, setFollowerCount] = React.useState(0)
  const [followingCount, setFollowingCount] = React.useState(0)
  const [isFollowingUser, setIsFollowingUser] = React.useState(false)
  const [isOwnProfile, setIsOwnProfile] = React.useState(false)

  //@ts-ignore //@todo: fix data discrepancies, see other todos
  const userId = creatorId
  const { creator } = useCreator(userId)
  const { isAuthenticated, address } = useContext(UserContext)

  useEffect(() => {
    setFollowerCount(creator?.followerCount || 0)
    setIsFollowingUser(creator?.isFollowing || false)
    setFollowingCount(creator?.followingCount || 0)
    setIsOwnProfile(isAuthenticated && userId === address)
  }, [isAuthenticated, address, userId, creator])

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
        handleAxiosError(error)
      }
    } else {
      try {
        await axios.post(`/api/creators/follow`, {
          userId: userId,
        })
        setFollowerCount(followerCount + 1)
        setIsFollowingUser(!isFollowingUser)
      } catch (error) {
        handleAxiosError(error)
      }
    }
    setFollowLoading(false)
  }

  return (
    <div className="flex dark:text-gray-400 items-center sm:h-6 mt-2 flex-wrap">
      <div className="mr-3 text-sm flex-shrink-0">
        <strong>{followerCount || 0}</strong> Followers
      </div>
      <div className="mr-3 text-sm flex-shrink-0">
        <strong>{followingCount || 0}</strong> Following
      </div>
      {isAuthenticated && !isOwnProfile && (
        <Button
          type={isFollowingUser ? 'link' : 'default'}
          onClick={onFollowButtonClick}
          loading={followLoading ? { delay: 250 } : false}
          className="flex-shrink-0 px-4"
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
