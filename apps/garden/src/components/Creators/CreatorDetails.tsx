import CreatorCharactersTab from '@/components/Creators/CreatorCharactersTab'
import CreatorCollectionsTab from '@/components/Creators/CreatorCollectionsTab'
import CreatorConceptsTab from '@/components/Creators/CreatorConceptsTab'
import CreatorCreationsTab from '@/components/Creators/CreatorCreationsTab'
import ProfileHeader from '@/components/Profile/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { CONFIG } from '@/lib/config'
import { UserContext } from '@/providers/UserProvider'
import { Creator } from '@edenlabs/eden-sdk'
import { Tabs } from 'antd'
import Head from 'next/head'
import React, { useContext } from 'react'

const CreatorDetails = ({
  creator,
  modalContainerRef,
  modalContainerHeight,
}: {
  creator: Creator
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  const { collections } = useCollections(creator.userId)
  const { userId, isAuthenticated } = useContext(UserContext)
  const isOwnProfile = isAuthenticated && creator.userId === userId

  const creatorPageTabs = [
    {
      label: 'Creations',
      key: 'creations',
      children: (
        <CreatorCreationsTab
          creatorId={creator.userId}
          modalContainerRef={modalContainerRef}
          modalContainerHeight={modalContainerHeight}
        />
      ),
    },
    {
      label: 'Concepts',
      key: 'concepts',
      children: <CreatorConceptsTab creatorId={creator.userId} />,
    },
    {
      label: 'Characters',
      key: 'characters',
      children: <CreatorCharactersTab creatorId={creator.userId} />,
    },
    {
      label: 'Collections',
      key: 'collections',
      children: <CreatorCollectionsTab collections={collections} />,
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
export default CreatorDetails
