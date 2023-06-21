import {UserContext} from '@/providers/UserProvider'
import {Button} from 'antd'
import {EditOutlined, UserAddOutlined, UserDeleteOutlined} from '@ant-design/icons'
import React, {useContext} from 'react'
import ProfileHeaderName from "@/components/ProfileHeaderName";
import ProfileHeaderSocial from "@/components/ProfileHeaderSocial";

const ProfileHeader = ({
                         creatorDisplayName,
                         isAuthUser,
                         numCreations,
                        ...rest
                       }: {
  creatorDisplayName: string
  isAuthUser: boolean
  numCreations: number | undefined
  followerCount: number | undefined
  followingCount: number | undefined
  isFollowingUser: boolean
  onFollowButtonClick: () => void
  followLoading: boolean
}) => {
  const {isAuthenticated} = useContext(UserContext)
  return (
    <div className="flex flex-col bg-gray-200 dark:bg-gray-900 rounded-lg p-4 relative">
      <div className="flex items-center">
        <div className="flex h-full flex-shrink-0 mr-4 w-min">
          <div className="h-12 w-12 rounded-full bg-white"></div>
        </div>
        <div className="flex flex-col justify-center w-full">
          <div className="mb-2">
            <ProfileHeaderName isOwnProfile={isAuthenticated && isAuthUser} displayName={creatorDisplayName}  />
          </div>
          <div className="text-sm"><strong>{numCreations || 0}</strong> Creations</div>
        </div>
      </div>
      <div className="col-span-full sm:col-span-1">
        <ProfileHeaderSocial isOwnProfile={isAuthenticated && isAuthUser} {...rest}/>
      </div>
    </div>
  )
}

export default ProfileHeader
