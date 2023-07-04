import CreationDetail from '@/components/Creation/CreationDetail/CreationDetail'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import React from 'react'

const CreationPage = ({ creationId }: { creationId: string }) => {
  const { creation } = useCreation(creationId)

  if (!creation) {
    return <LoadingIndicator />
  }

  return <CreationDetail creation={creation} />
}

export default CreationPage
