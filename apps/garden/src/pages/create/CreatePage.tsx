import CreationInterface from '@/components/CreationInterface/CreationInterface'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const CreatePage = () => {
  return (
    <div className={`flex min-h-screen ${inter.className}`}>
      <CreationInterface />
    </div>
  )
}

export default CreatePage
