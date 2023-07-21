import CreationDetail from '@/components/Creation/CreationDetail/CreationDetail'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const CreationPage = ({ data }: { data: Creation }) => {
  const { creation: creationData } = useCreation(data._id, false, {
    fallbackData: data,
  })

  if (!creationData) {
    return <LoadingIndicator />
  }

  return <CreationDetail creation={creationData} />
}

export default CreationPage
