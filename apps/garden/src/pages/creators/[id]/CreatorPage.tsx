import CreatorDetails from '@/components/Creators/CreatorDetails'
import { useCreator } from '@/hooks/useCreator'
import { Creator } from '@edenlabs/eden-sdk'
import React from 'react'

const CreatorPage = ({ data }: { data: Creator }) => {
  const { creator: creatorData } = useCreator(data ? data.userId : null, {
    fallbackData: data,
  })

  if (!data) {
    return null
  }

  return <CreatorDetails creator={creatorData || data} />
}

export default CreatorPage
