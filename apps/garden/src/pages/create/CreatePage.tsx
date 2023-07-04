import CreationInterface from '@/components/Creation/CreationInterface/CreationInterface'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const CreatePage = () => {
  return (
    <div className={`flex ${inter.className}`}>
      <CreationInterface />
    </div>
  )
}

export default CreatePage
