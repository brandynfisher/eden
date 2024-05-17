import CreatorDetails from '@/components/Creators/CreatorDetails'
import { useCreator } from '@/hooks/useCreator'
import { Creator } from '@edenlabs/eden-sdk'
import React from 'react'

const CreatorPage = ({
  initialData,
  activeTab,
}: {
  initialData: Creator
  activeTab: string
}) => {
  const { creator: creatorData } = useCreator(initialData ? initialData._id : null, {
    fallbackData: initialData,
  })

  if (!creatorData && !initialData) {
    return null
  }

  return (
    <CreatorDetails
      creator={creatorData || initialData}
      initialActiveTab={activeTab}
    />
  )
}

export default CreatorPage
