import { Space } from 'antd'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const CreatePage = () => {
  return (
    <main className={`flex min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <div className={`text-3xl text-black ${inter.className}`}>Create</div>
      </Space>
    </main>
  )
}

export default CreatePage
