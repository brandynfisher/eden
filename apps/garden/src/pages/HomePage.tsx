import CreationMasonry from '@/components/CreationMasonry'
import { useCreations } from '@/hooks/useCreations'
import { Space } from 'antd'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const HomePage = () => {
  const { creations } = useCreations()

  return (
    <main className={`flex min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <div className={`text-3xl text-black ${inter.className}`}>
          The Garden of Eden
        </div>
        {creations && <CreationMasonry creations={creations} />}
      </Space>
    </main>
  )
}

export default HomePage
