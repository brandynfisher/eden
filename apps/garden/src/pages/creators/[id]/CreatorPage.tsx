import CollectionCard from '@/components/Collections/CollectionCard'
import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByLatest,
  OrderByPopularity, // OrderByScore,
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
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const ProfileHeader = dynamic(
  () => import('@/components/Profile/ProfileHeader'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreationTabContent = ({ creatorId }: { creatorId: string }) => {
  return (
    <div className="mt-4">
      <MasonryInfinite
        key={`creations_${creatorId}`}
        type="creations"
        query={{ userId: creatorId }}
        hasSort={[OrderByLatest, OrderByPopularity]}
        ItemComponent={CreationCard}
      />
    </div>
  )
}

const ConceptTabContent = ({ creatorId }: { creatorId: string }) => {
  return (
    <div className="mt-4">
      <MasonryInfinite
        key={`concepts_${creatorId}`}
        type="concepts"
        query={{ userId: creatorId }}
        hasSort={[OrderByLatest]}
        ItemComponent={ConceptCard}
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
  const router = useRouter()
  const { collections } = useCollections(creator.userId)
  const { userId, isAuthenticated } = useContext(UserContext)
  const isAuthenticatedUser = isAuthenticated && creator.userId === userId
  const [activeTabKey, setActiveTabKey] = useState(
    (router.query.tab as string) || 'creations',
  )

  useEffect(() => {
    const tabKey = router.query.tab as string

    if (!tabKey) {
      setActiveTabKey('creations')
      return
    }

    setActiveTabKey(tabKey)
  }, [router.query])

  const creatorPageTabs = [
    {
      label: 'Creations',
      key: 'creations',
      children: <CreationTabContent creatorId={creator.userId} />,
    },
    {
      label: 'Concepts',
      key: 'concepts',
      children: <ConceptTabContent creatorId={creator.userId} />,
    },
    {
      label: 'Collections',
      key: 'collections',
      children: <CollectionTabContent collections={collections} />,
    },
  ]

  const handleTabClick = async (tabKey: string) => {
    await router.push(
      { pathname: '/creators/[id]', query: { tab: tabKey } },
      { pathname: `/creators/${creator.username}`, query: { tab: tabKey } },
    )
  }

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
          <Tabs
            activeKey={activeTabKey}
            centered
            items={creatorPageTabs}
            onTabClick={handleTabClick}
          />
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
