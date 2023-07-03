import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const MeCreatorPage = () => {
  const { address, isConnected } = useContext(UserContext)

  if (!isConnected || !address) {
    return null
  }

  return <CreatorPage creatorId={address} />
}

const MePage = () => {
  return <MeCreatorPage />
}

export default MePage
