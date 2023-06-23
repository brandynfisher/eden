import CollectionCard from '@/components/Collections/CollectionCard'
import CreationFilters from '@/components/CreationFilters'
import CreationMasonry from '@/components/CreationMasonry'
import ProfileHeader from '@/components/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { useFeed } from '@/hooks/useFeed'
import { UserContext } from '@/providers/UserProvider'
import { Collection, Creation } from '@eden-labs/eden-sdk'
import { Space, Tabs } from 'antd'
import { Inter } from 'next/font/google'
import React, { useContext } from 'react'

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

  return creations ? (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <ProfileHeader
          creatorId={creatorId}
          creatorDisplayName={
            creator && creator.username ? creator.username : creatorId
          }
          numCreations={creations.length}
          isAuthUser={isAuthUser}
        />
        <Tabs defaultActiveKey="1" centered items={creatorPageTabs} />
      </Space>
    </div>
  ) : (
    <p>Loading...</p>
  )
}

export default CreatorPage
