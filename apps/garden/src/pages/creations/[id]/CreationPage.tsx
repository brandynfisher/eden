import CreationDetail from '@/components/Creation/CreationDetail/CreationDetail'
import { useCreation } from '@/hooks/useCreation'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const CreationPage = ({ data }: { data: Creation }) => {
  const { creation: creationData } = useCreation(data._id, false, {
    fallbackData: data,
  })

  return <CreationDetail creation={creationData || data} />
}

export default CreationPage
