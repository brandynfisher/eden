import CreatorCharactersTab from '@/components/Creators/CreatorCharactersTab'
import CreatorCollectionsTab from '@/components/Creators/CreatorCollectionsTab'
import CreatorConceptsTab from '@/components/Creators/CreatorConceptsTab'
import CreatorCreationsTab from '@/components/Creators/CreatorCreationsTab'
import LoadingIndicator from '@/components/LoadingIndicator'
import ProfileHeader from '@/components/Profile/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { useCreator } from '@/hooks/useCreator'
import { UserContext } from '@/providers/UserProvider'
import { Creator } from '@edenlabs/eden-sdk'
import { Tabs } from 'antd'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

const CreatorDetails = ({
  creator,
  modalContainerRef,
  modalContainerHeight,
  initialActiveTab,
}: {
  creator: Creator
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
  initialActiveTab?: string
}) => {
  const { creator: creatorData } = useCreator(creator._id, {
    fallbackData: { creator },
  })
  const { collections, refetchCollections } = useCollections(creator._id)
  const { userId, isAuthenticated } = useContext(UserContext)
  const isOwnProfile = isAuthenticated && creatorData?.userId === userId
  const router = useRouter()
  const creatorPageTabs = [
    {
      label: 'Creations',
      key: 'creations',
      children: (
        <CreatorCreationsTab
          isOwnProfile={isOwnProfile}
          creatorId={creator._id}
          modalContainerRef={modalContainerRef}
          modalContainerHeight={modalContainerHeight}
        />
      ),
    },
    {
      label: 'Concepts',
      key: 'concepts',
      children: (
        <CreatorConceptsTab
          creatorId={creator._id}
          modalContainerRef={modalContainerRef}
          modalContainerHeight={modalContainerHeight}
        />
      ),
    },
    {
      label: 'Characters',
      key: 'characters',
      children: (
        <CreatorCharactersTab
          creatorId={creator._id}
          modalContainerRef={modalContainerRef}
          modalContainerHeight={modalContainerHeight}
        />
      ),
    },
    {
      label: 'Collections',
      key: 'collections',
      children: (
        <CreatorCollectionsTab
          collections={collections}
          refetchCollections={refetchCollections}
        />
      ),
    },
  ]

  if (!creatorData) {
    return <LoadingIndicator />
  }

  return (
    <div className={`flex flex-col gap-2`}>
      <ProfileHeader
        creatorId={creatorData._id}
        creator={creatorData}
        numCreations={creatorData?.creationCount}
        isOwnProfile={isOwnProfile}
      />
      <Tabs
        onChange={async tabKey => {
          await router.push(
            `/creators/${creatorData.username}/${tabKey}`,
            undefined,
            { shallow: true },
          )
        }}
        activeKey={
          router.query.tab
            ? String(router.query.tab)
            : initialActiveTab || 'creations'
        }
        centered
        items={creatorPageTabs}
        destroyInactiveTabPane={true}
      />
    </div>
  )
}
export default CreatorDetails
