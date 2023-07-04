import CollectionCard from '@/components/Collections/CollectionCard'
import CreationMasonry from '@/components/Creation/CreationMasonry'
import ProfileHeader from '@/components/Profile/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { useFeed } from '@/hooks/useFeed'
import { UserContext } from '@/providers/UserProvider'
import { Collection, Creation } from '@eden-labs/eden-sdk'
import { Button, Empty, Space, Tabs } from 'antd'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import React, { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const CreationTabContent = ({
  creations,
  isConnectedUser,
}: {
  creations: Creation[]
  isConnectedUser: boolean
}) => {
  return (
    <div className="mt-4">
      {creations.length ? (
        <CreationMasonry creations={creations} />
      ) : (
        <div className="flex flex-col items-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center">
                <div className="mb-4">Nothing created yet.</div>

                {isConnectedUser && (
                  <Link href="/create">
                    <Button
                      type="dashed"
                      className="flex items-center text-gray-400"
                    >
                      <div>Begin here</div>
                    </Button>
                  </Link>
                )}
              </div>
            }
          />
        </div>
      )}
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
  const { isAuthenticated, address, isConnected } = useContext(UserContext)
  const { creations } = useFeed({ isAuthenticated, userId: creatorId })
  const { creator } = useCreator(creatorId)
  const { collections } = useCollections(creatorId)
  const isConnectedUser = isConnected && creatorId === address

  const creatorPageTabs = [
    {
      label: 'Creations',
      key: '1',
      children: (
        <CreationTabContent
          creations={creations}
          isConnectedUser={isConnectedUser}
        />
      ),
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
          isConnectedUser={isConnectedUser}
        />
        <Tabs defaultActiveKey="1" centered items={creatorPageTabs} />
      </Space>
    </div>
  ) : (
    <p>Loading...</p>
  )
}

export default CreatorPage
