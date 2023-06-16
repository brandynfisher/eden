import CreationFilters from '@/components/CreationFilters'
import CreationMasonry from '@/components/CreationMasonry'
import ProfileHeader from '@/components/ProfileHeader'
import { useFeed } from '@/hooks/useFeed'
import { UserContext } from '@/providers/UserProvider'
import { Space } from 'antd'
import { Inter } from 'next/font/google'
import React, { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const CreatorPage = ({ creatorId }: { creatorId: string }) => {
  const { isAuthenticated } = useContext(UserContext)
  const { creations } = useFeed({ isAuthenticated, userId: creatorId })

  return creations ? (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <ProfileHeader
          creatorDisplayName={creatorId}
          numCreations={creations.length}
        />
        <div className="flex-grow mt-4">
          <CreationFilters />
          {creations && <CreationMasonry creations={creations} />}
        </div>
      </Space>
    </div>
  ) : (
    <p>Loading...</p>
  )
}

export default CreatorPage
