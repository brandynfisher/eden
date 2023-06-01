import CreationFilters from '@/components/CreationFilters'
import Masonry from '@/components/Masonry'
import ProfileHeader from '@/components/ProfileHeader'
import { chunkArray } from '@/lib/chunk'
import { UserContext } from '@/providers/UserProvider'
import { Space } from 'antd'
import { Inter } from 'next/font/google'
import React, { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const MePage = () => {
  const { creations } = useContext(UserContext)
  const creationImages =
    creations &&
    (chunkArray(
      creations.map(creation => creation.thumbnail),
      3,
    ) as string[][])
  return (
    <main className={`flex min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <ProfileHeader />
        <CreationFilters />
        {creationImages && <Masonry images={creationImages} />}
      </Space>
    </main>
  )
}

export default MePage
