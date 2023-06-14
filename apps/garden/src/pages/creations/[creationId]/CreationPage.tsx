import CreationDetail from '@/components/CreationDetail'
import { useCreation } from '@/hooks/useCreation'
import { useRouter } from 'next/router'
import React from 'react'

const CreationPage = () => {
  const { creationId } = useRouter().query
  const { creation } = useCreation(creationId as string)
  return creation && <CreationDetail creation={creation} />
}

export default CreationPage
