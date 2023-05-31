import { UserContext } from '@/providers/UserProvider'
import { Space } from 'antd'
import { Inter } from 'next/font/google'
import React, { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const MePage = () => {
  const { mannaBalance } = useContext(UserContext)

  return (
    <main className={`flex min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <div className={`text-3xl text-black ${inter.className}`}>
          My Profile
        </div>
        <div className={`text-med text-black ${inter.className}`}>
          Manna Balance: {mannaBalance}
        </div>
      </Space>
    </main>
  )
}

export default MePage
