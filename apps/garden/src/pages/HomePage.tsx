import Masonry from '@/components/Masonry'
import { useCreations } from '@/hooks/useCreations'
import { chunkArray } from '@/lib/chunk'
import { Space } from 'antd'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const HomePage = () => {
  const { creations } = useCreations()
  const creationImages =
    creations &&
    (chunkArray(
      creations.map(creation => creation.thumbnail),
      3,
    ) as string[][])

  return (
    <main className={`flex min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <div className={`text-3xl text-black ${inter.className}`}>
          The Garden of Eden
        </div>
        {creationImages && <Masonry images={creationImages} />}
      </Space>
    </main>
  )
}

export default HomePage
