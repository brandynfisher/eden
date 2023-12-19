import CharacterFeedCard from '@/components/Characters/CharacterFeedCard'
import CollectionCard from '@/components/Collections/CollectionCard'
import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByLatest,
  OrderByLikedByMe,
  OrderByUsage,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import ProfileHeader from '@/components/Profile/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { CONFIG } from '@/lib/config'
import { UserContext } from '@/providers/UserProvider'
import { Collection, Creator } from '@edenlabs/eden-sdk'
import { Tabs } from 'antd'
import Head from 'next/head'
import React, { useContext } from 'react'

const CreationTabContent = ({ creatorId }: { creatorId: string }) => {
  const { isAuthenticated, isAuthenticating, userId } = useContext(UserContext)

  if (!isAuthenticated && isAuthenticating) {
    return <LoadingIndicator />
  }

  const filters =
    isAuthenticated && userId === creatorId
      ? [OrderByLatest, OrderByLikedByMe]
      : [OrderByLatest]

  return (
    <div className="mt-4">
      <MasonryInfiniteContainer
        key={`creations_${creatorId}`}
        itemType="creation"
        query={{ userId: creatorId }}
        filters={filters}
        ItemComponent={CreationCard}
      />
    </div>
  )
}

const ConceptTabContent = ({ creatorId }: { creatorId: string }) => {
  return (
    <div className="mt-4">
      <MasonryInfiniteContainer
        key={`concepts_${creatorId}`}
        itemType="concept"
        query={{ userId: creatorId }}
        filters={[OrderByLatest, OrderByUsage]}
        ItemComponent={ConceptCard}
      />
    </div>
  )
}

const CharacterTabContent = ({ creatorId }: { creatorId: string }) => {
  return (
    <div className="mt-4">
      <MasonryInfiniteContainer
        key={`characters_${creatorId}`}
        itemType="character"
        query={{ userId: creatorId }}
        filters={[OrderByLatest, OrderByUsage]}
        ItemComponent={CharacterFeedCard}
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
  const { userId, isAuthenticated } = useContext(UserContext)
  const isOwnProfile = isAuthenticated && creator.userId === userId

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
      label: 'Characters',
      key: 'characters',
      children: <CharacterTabContent creatorId={creator.userId} />,
    },
    {
      label: 'Collections',
      key: 'collections',
      children: <CollectionTabContent collections={collections} />,
    },
  ]

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

      <div className={`flex flex-col gap-2`}>
        <ProfileHeader
          creatorId={creator.userId}
          creator={creator}
          numCreations={creator?.creationsCount}
          isOwnProfile={isOwnProfile}
        />
        <Tabs
          defaultActiveKey="1"
          centered
          items={creatorPageTabs}
          destroyInactiveTabPane={true}
        />
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
