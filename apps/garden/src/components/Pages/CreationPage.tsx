import Details from '@/components/Detail/Details'
import { useCreation } from '@/hooks/useCreation'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const CreationPage = ({ initialData }: { initialData: Creation }) => {
  const { creation: creationData } = useCreation(initialData ? initialData._id : null, {
    fallbackData: initialData,
  })

  if (!initialData && !creationData) {
    return null
  }

  return <Details itemType="creation" item={creationData || initialData} />
}

export default CreationPage
