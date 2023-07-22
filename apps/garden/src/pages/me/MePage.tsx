import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreator } from '@/hooks/useCreator'
import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import React from 'react'

const MePage = ({ address }: { address: string }) => {
  const { creator } = useCreator(address)

  if (!creator) {
    return <LoadingIndicator />
  }

  return <CreatorPage data={creator} />
}

export default MePage
