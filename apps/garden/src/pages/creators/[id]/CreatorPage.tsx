import CollectionCard from '@/components/Collections/CollectionCard'
import CreationFilters from '@/components/CreationFilters'
import CreationMasonry from '@/components/CreationMasonry'
import ProfileHeader from '@/components/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { useFeed } from '@/hooks/useFeed'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Collection, Creation } from '@eden-labs/eden-sdk'
import { Space, Tabs } from 'antd'
import axios from 'axios'
import { Inter } from 'next/font/google'
import React, { useContext, useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

const CreationTabContent = ({ creations }: { creations: Creation[] }) => {
  return (
    <div className="flex-grow mt-4">
      <CreationFilters />
      {creations && <CreationMasonry creations={creations} />}
    </div>
  )
}

const CollectionTabContent = ({
  collections,
}: {
  collections: Collection[] | undefined
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {collections &&
        collections.map(collection => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
    </div>
  )
}
const CreatorPage = ({ creatorId }: { creatorId: string }) => {
  const { isAuthenticated, address } = useContext(UserContext)
  const { creations } = useFeed({ isAuthenticated, userId: creatorId })
  const { creator } = useCreator(creatorId)
  const { collections } = useCollections(creatorId)
  const isAuthUser = isAuthenticated && creatorId === address
  const [followerCount, setFollowerCount] = React.useState(0)
  const [isFollowingUser, setIsFollowingUser] = React.useState(false)
  const [followLoading, setFollowLoading] = React.useState(false)

  useEffect(() => {
    setFollowerCount(creator?.followerCount || 0)
    setIsFollowingUser(creator?.isFollowing || false)
  }, [creator])

  const creatorPageTabs = [
    {
      label: 'Creations',
      key: '1',
      children: <CreationTabContent creations={creations} />,
    },
    {
      label: 'Collections',
      key: '2',
      children: <CollectionTabContent collections={collections} />,
    },
  ]

  const onFollowButtonClick = async () => {
    setFollowLoading(true)
    if (isFollowingUser) {
      try {
        await axios.post(`/api/creators/unfollow`, {
          userId: creatorId,
        })
        setFollowerCount(followerCount - 1)
        setIsFollowingUser(!isFollowingUser)
      } catch (error) {
        handleAxiosError(error)
      }
    } else {
      try {
        await axios.post(`/api/creators/follow`, {
          userId: creatorId,
        })
        setFollowerCount(followerCount + 1)
        setIsFollowingUser(!isFollowingUser)
      } catch (error) {
        handleAxiosError(error)
      }
    }
    setFollowLoading(false)
  }

  return creations ? (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <ProfileHeader
          creatorDisplayName={
            creator && creator.username ? creator.username : creatorId
          }
          numCreations={creations.length}
          followerCount={followerCount}
          followingCount={creator?.followingCount}
          isAuthUser={isAuthUser}
          isFollowingUser={isFollowingUser}
          onFollowButtonClick={onFollowButtonClick}
          followLoading={followLoading}
        />
        <Tabs defaultActiveKey="1" centered items={creatorPageTabs} />
      </Space>
    </div>
  ) : (
    <p>Loading...</p>
  )
}

export default CreatorPage
