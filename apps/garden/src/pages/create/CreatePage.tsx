import CreationInterface from '@/components/CreationInterface/CreationInterface'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const CreatePage = () => {
  return (
    <main className={`flex min-h-screen ${inter.className}`}>
      <CreationInterface />
    </main>
  )
}

export default CreatePage
