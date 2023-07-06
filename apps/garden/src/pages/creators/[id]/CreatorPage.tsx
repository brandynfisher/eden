import CollectionCard from '@/components/Collections/CollectionCard'
import CreationMasonry from '@/components/Creation/CreationMasonry'
import ProfileHeader from '@/components/Profile/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { UserContext } from '@/providers/UserProvider'
import { Collection } from '@eden-labs/eden-sdk'
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
const CreatorPage = ({ creatorId }: { creatorId: string }) => {
  const { address, isConnected } = useContext(UserContext)
  const { creator } = useCreator(creatorId)
  const { collections } = useCollections(creatorId)
  const isConnectedUser = isConnected && creatorId === address

  const creatorPageTabs = [
    {
      label: 'Creations',
      key: '1',
      children: <CreationTabContent creatorId={creatorId} />,
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
          creatorId={creatorId}
          creatorDisplayName={
            creator && creator.username ? creator.username : creatorId
          }
          numCreations={creator?.creationsCount}
          isConnectedUser={isConnectedUser}
        />
        <Tabs defaultActiveKey="1" centered items={creatorPageTabs} />
      </Space>
    </div>
  )
}

export default CreatorPage
