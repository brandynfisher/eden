import CollectionCard from '@/components/Collections/CollectionCard'
import CreationMasonry from '@/components/Creation/CreationMasonry'
import LoadingIndicator from '@/components/LoadingIndicator'
import ProfileHeader from '@/components/Profile/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { UserContext } from '@/providers/UserProvider'
import { Collection, Creator } from '@edenlabs/eden-sdk'
import { Space, Tabs } from 'antd'
import { Inter } from 'next/font/google'
import React, { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const CreationTabContent = ({ creatorId }: { creatorId: string }) => {
  return (
    <div className="mt-4">
      <CreationMasonry query={{ userId: creatorId }} hasSort={true} />
    </div>
  )
}

const CollectionTabContent = ({
  collections,
}: {
  collections: Collection[] | undefined
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {collections &&
        collections.map(collection => (
          <CollectionCard key={collection._id} collection={collection} />
        ))}
    </div>
  )
}

const CreatorPageContent = ({ creator }: { creator: Creator }) => {
  const { address, isConnected } = useContext(UserContext)
  const { collections } = useCollections(creator.userId)
  const isConnectedUser = isConnected && creator.userId === address

  const creatorPageTabs = [
    {
      label: 'Creations',
      key: '1',
      children: <CreationTabContent creatorId={creator.userId} />,
    },
    {
      label: 'Collections',
      key: '2',
      children: <CollectionTabContent collections={collections} />,
    },
  ]

  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <ProfileHeader
          creatorId={creator.userId}
          creator={creator}
          numCreations={creator?.creationsCount}
          isConnectedUser={isConnectedUser}
        />
        <Tabs defaultActiveKey="1" centered items={creatorPageTabs} />
      </Space>
    </div>
  )
}

const CreatorPage = ({ creatorId }: { creatorId: string }) => {
  const { creator, isLoading, error } = useCreator(creatorId)

  if (isLoading) {
    return <LoadingIndicator />
  }

  if (error) {
    console.error(error)
  }

  if (!creator) {
    // @todo: redirect orshow  404?
    return <>not found: {creatorId}</>
  }

  return <CreatorPageContent creator={creator} />
}

export default CreatorPage
