import CollectionCard from '@/components/Collections/CollectionCard'
import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByBookmarks,
  OrderByLatest,
  OrderByPraises, // OrderByScore,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfinite from '@/components/MasonryInfinite'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { CONFIG } from '@/lib/config'
import { UserContext } from '@/providers/UserProvider'
import { Collection, Creator } from '@edenlabs/eden-sdk'
import { Space, Tabs } from 'antd'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import React, { useContext } from 'react'

const ProfileHeader = dynamic(
  () => import('@/components/Profile/ProfileHeader'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreationTabContent = ({ creatorId }: { creatorId: string }) => {
  const { isAuthenticated } = useContext(UserContext)

  const sortButtons = isAuthenticated
    ? [
        OrderByLatest,
        // OrderByScore,
        OrderByPraises,
        OrderByBookmarks,
      ]
    : [OrderByLatest]

  return (
    <div className="mt-4">
      <MasonryInfinite
        query={{ userId: creatorId }}
        hasSort={sortButtons}
        type="creations"
        itemComponent={CreationCard}
      />
    </div>
  )
}

const ConceptTabContent = ({ creatorId }: { creatorId: string }) => {
  return (
    <div className="mt-4">
      <MasonryInfinite
        query={{ userId: creatorId }}
        hasSort={[OrderByLatest]}
        type="concepts"
        itemComponent={ConceptCard}
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
  const { collections } = useCollections(creator.userId)
  const { userId, isAuthenticated, featureFlags } = useContext(UserContext)
  const isAuthenticatedUser = isAuthenticated && creator.userId === userId
  const isPreviewUser = featureFlags.includes('preview')

  const creatorPageTabs = [
    {
      label: 'Creations',
      key: '1',
      children: <CreationTabContent creatorId={creator.userId} />,
    },
  ]

  if (isPreviewUser) {
    creatorPageTabs.push({
      label: 'Concepts',
      key: '2',
      children: <ConceptTabContent creatorId={creator.userId} />,
    })
  }

  creatorPageTabs.push({
    label: 'Collections',
    key: '3',
    children: <CollectionTabContent collections={collections} />,
  })

  return (
    <>
      <Head>
        <title>{`${creator.username} | Garden of Eden`}</title>
        <meta
          property="og:title"
          key="title"
          content={`${creator.username} | Garden of Eden`}
        />
        <meta
          property="og:description"
          content={`${creator.username}'s Profile - ${creator.creationsCount} Creations | ${creator.followerCount} Followers`}
          key="description"
        />
        <meta
          property="og:image"
          content={
            creator.userImage
              ? creator.userImage
              : 'https://app.eden.art/apple-touch-icon.png'
          }
          key="image"
        />
        <meta
          property="og:image:secure_url"
          content={
            creator.userImage
              ? creator.userImage
              : 'https://app.eden.art/apple-touch-icon.png'
          }
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

      <div className={`flex flex-col`}>
        <Space direction="vertical">
          <ProfileHeader
            creatorId={creator.userId}
            creator={creator}
            numCreations={creator?.creationsCount}
            isAuthenticatedUser={isAuthenticatedUser}
          />
          <Tabs defaultActiveKey="1" centered items={creatorPageTabs} />
        </Space>
      </div>
    </>
  )
}

const CreatorPage = ({ data }: { data: Creator }) => {
  const { creator: creatorData } = useCreator(data ? data.userId : null, {
    fallbackData: data,
  })

  if (!data) {
    return null
  }

  return <CreatorPageContent creator={creatorData || data} />
}

export default CreatorPage
