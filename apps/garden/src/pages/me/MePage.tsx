import CreationFilters from '@/components/CreationFilters'
import Masonry from '@/components/Masonry'
import ProfileHeader from '@/components/ProfileHeader'
import { exImages } from '@/pages/HomePage'
import { Space } from 'antd'
import { Inter } from 'next/font/google'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

const MePage = () => {
  return (
    <main className={`flex min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <ProfileHeader />
        <CreationFilters />
        <Masonry images={exImages} />
      </Space>
    </main>
  )
}

export default MePage
