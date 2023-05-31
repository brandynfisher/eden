import TaskButton from '@/components/TaskButton'
import { UserContext } from '@/providers/UserProvider'
import { Space } from 'antd'
import { Inter } from 'next/font/google'
import { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const { mannaBalance } = useContext(UserContext)

  return (
    <main className={`flex min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <div className={`text-3xl text-black ${inter.className}`}>
          Manna Balance: {mannaBalance}
        </div>
        <TaskButton />
      </Space>
    </main>
  )
}
