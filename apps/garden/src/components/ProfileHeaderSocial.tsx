import {Button} from 'antd'
import {UserAddOutlined, UserDeleteOutlined} from '@ant-design/icons'
import React from 'react'

const ProfileHeaderSocial = ({
                               isOwnProfile,
                               followerCount,
                               followingCount,
                               isFollowingUser,
                               onFollowButtonClick,
                               followLoading,
                             }: {
  isOwnProfile: boolean,
  followerCount: number | undefined
  followingCount: number | undefined
  isFollowingUser: boolean
  onFollowButtonClick: () => void
  followLoading: boolean
}) => {
  return (
    <div className="flex dark:text-gray-400 items-center sm:h-6 mt-4 flex-wrap">
      <div className="mr-3 text-sm flex-shrink-0">
        <strong>{followerCount || 0}</strong> Followers
      </div>
      <div className="mr-3 text-sm flex-shrink-0">
          <strong>{followingCount || 0}</strong> Following
      </div>
      {isOwnProfile && (
        <Button
          size="small"
          type={isFollowingUser ? 'link' : 'default'}
          onClick={onFollowButtonClick}
          loading={followLoading ? {delay: 250} : false}
          className="flex-shrink-0"
        >
          {isFollowingUser ? <><UserDeleteOutlined/> Following</> : <><UserAddOutlined/> Follow</>}
        </Button>
      )}
    </div>
  )
}

export default ProfileHeaderSocial
