import Details from '@/components/Detail/Details'
import { useCreation } from '@/hooks/useCreation'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const CreationPage = ({ data }: { data: Creation }) => {
  const { creation: creationData } = useCreation(data ? data._id : null, {
    fallbackData: data,
  })

  if (!data) {
    return null
  }

  return (
    <Details
      itemType="creation"
      item={creationData || data}
      // loadSimilar={true}
    />
  )
}

export default CreationPage
