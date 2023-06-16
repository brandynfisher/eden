import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const MePage = () => {
  const { address, isAuthenticated } = useContext(UserContext)

  return (
    <>
      {isAuthenticated && address ? (
        <CreatorPage creatorId={address} />
      ) : (
        <div>Not logged in</div>
      )}
    </>
  )
}

export default MePage
