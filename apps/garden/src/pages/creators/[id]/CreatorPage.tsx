import CollectionCard from '@/components/Collections/CollectionCard'
import CreationMasonry from '@/components/Creation/CreationMasonry'
import {
  OrderByBookmarks,
  OrderByLatest,
  OrderByPraises,
} from '@/components/OrderByButtons'
import ProfileHeader from '@/components/Profile/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { CONFIG } from '@/lib/config'
import { UserContext } from '@/providers/UserProvider'
import { Collection, Creator } from '@edenlabs/eden-sdk'
import { Space, Tabs } from 'antd'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import React, { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const CreationTabContent = ({ creatorId }: { creatorId: string }) => {
  return (
    <div className="mt-4">
      <CreationMasonry
        query={{ userId: creatorId }}
        hasSort={[OrderByLatest, OrderByPraises, OrderByBookmarks]}
      />
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
    <>
      <Head>
        <title>{`${creator.username} - Creator | Garden of Eden`}</title>
        <meta
          property="og:title"
          key="title"
          content={`${creator.username} - Creator | Garden of Eden`}
        />
        <meta
          property="og:description"
          content={`${creator.username}'s Profile - ${creator.creationsCount} Creations | ${creator.followerCount} Followers`}
          key="description"
        />
        {/* @todo: replace generic logo image with user profile image  */}
        <meta
          property="og:image"
          content="https://app.eden.art/apple-touch-icon.png"
          key="image"
        />
        <meta
          property="og:image:secure_url"
          content="https://app.eden.art/apple-touch-icon.png"
        />
        <meta
          property="og:image:alt"
          content={`${creator.username} - Creator`}
        />
        <meta
          property="og:url"
          content={`${
            CONFIG.NEXT_PUBLIC_HOST
          }/creators/${creator.username?.toLowerCase()}`}
        />
      </Head>

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
    </>
  )
}

const CreatorPage = ({ data }: { data: Creator }) => {
  const { creator: creatorData } = useCreator(data.userId, {
    fallbackData: data,
  })

  return <CreatorPageContent creator={creatorData || data} />
}

export default CreatorPage
