import CreationMasonry from '@/components/CreationMasonry'
import { useCreations } from '@/hooks/useCreations'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const HomePage = () => {
  const { creations } = useCreations()

  return (
    <main className={`flex flex-col min-h-screen ${inter.className}`}>
      <div className={`text-3xl text-black ${inter.className}`}>
        The Garden of Eden
      </div>
      <div className="flex-grow mt-4">
        {' '}
        {creations && <CreationMasonry creations={creations} />}
      </div>
    </main>
  )
}

export default HomePage
