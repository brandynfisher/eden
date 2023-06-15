import CreationFilters from '@/components/CreationFilters'
import CreationMasonry from '@/components/CreationMasonry'
import ProfileHeader from '@/components/ProfileHeader'
import { UserContext } from '@/providers/UserProvider'
import { Space } from 'antd'
import { Inter } from 'next/font/google'
import React, { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const MePage = () => {
  const { creations } = useContext(UserContext)
  return (
    <main className={`flex flex-col min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <ProfileHeader />
        <div className="flex-grow mt-4">
          <CreationFilters />
          {creations && <CreationMasonry creations={creations} />}
        </div>
      </Space>
    </main>
  )
}

export default MePage
