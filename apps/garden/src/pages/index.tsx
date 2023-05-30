import AuthModal from '@/components/AuthModal'
import TaskButton from '@/components/TaskButton'
import { Button } from 'antd'
import { Inter } from 'next/font/google'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <Button onClick={() => setAuthModalOpen(true)}>Authenticate</Button>
      <AuthModal
        open={authModalOpen}
        onCancel={() => setAuthModalOpen(false)}
      />
      <TaskButton />
    </main>
  )
}
