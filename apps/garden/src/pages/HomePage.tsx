import CreationMasonry from '@/components/CreationMasonry'
import { useFeed } from '@/hooks/useFeed'
import { UserContext } from '@/providers/UserProvider'
import { Inter } from 'next/font/google'
import { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const HomePage = () => {
  const { isAuthenticated } = useContext(UserContext)
  const { creations } = useFeed({ isAuthenticated })

  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      {creations && <CreationMasonry creations={creations} />}
    </div>
  )
}

export default HomePage
