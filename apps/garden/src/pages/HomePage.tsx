import CreationMasonry from '@/components/CreationMasonry'
import { useCreations } from '@/hooks/useCreations'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const HomePage = () => {
  const { creations } = useCreations()

  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      <div className="flex-grow">
        {creations && <CreationMasonry creations={creations} />}
      </div>
    </div>
  )
}

export default HomePage
