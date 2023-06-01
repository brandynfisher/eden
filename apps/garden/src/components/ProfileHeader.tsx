import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const ProfileHeader = () => {
  const { address, creations } = useContext(UserContext)
  const numCreations = creations ? creations.length : 0
  return (
    <div className="flex items-center bg-blue-500 rounded-lg p-4">
      <div className="flex-shrink-0 mr-4">
        <div className="h-12 w-12 rounded-full bg-white"></div>
      </div>
      <div>
        <h2 className="text-white text-lg font-semibold">{address}</h2>
        <p className="text-white text-sm">{numCreations} Creations</p>
      </div>
    </div>
  )
}

export default ProfileHeader
