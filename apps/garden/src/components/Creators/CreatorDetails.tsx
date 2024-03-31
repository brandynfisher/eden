import CreatorCharactersTab from '@/components/Creators/CreatorCharactersTab'
import CreatorCollectionsTab from '@/components/Creators/CreatorCollectionsTab'
import CreatorConceptsTab from '@/components/Creators/CreatorConceptsTab'
import CreatorCreationsTab from '@/components/Creators/CreatorCreationsTab'
import ProfileHeader from '@/components/Profile/ProfileHeader'
import { useCollections } from '@/hooks/useCollections'
import { UserContext } from '@/providers/UserProvider'
import { Creator } from '@edenlabs/eden-sdk'
import { Tabs } from 'antd'
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
  const { collections, refetchCollections } = useCollections(creator.userId)
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
      children: (
        <CreatorConceptsTab
          creatorId={creator.userId}
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
          creatorId={creator.userId}
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

  return (
    <div className={`flex flex-col gap-2`}>
      <ProfileHeader
        creatorId={creator.userId}
        creator={creator}
        numCreations={creator?.creationCount}
        isOwnProfile={isOwnProfile}
      />
      <Tabs
        defaultActiveKey="1"
        centered
        items={creatorPageTabs}
        destroyInactiveTabPane={true}
      />
    </div>
  )
}
export default CreatorDetails
