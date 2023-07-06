import CreationMasonry from '@/components/Creation/CreationMasonry'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const HomePage = () => {
  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      <CreationMasonry hasSort={true} />
    </div>
  )
}

export default HomePage
