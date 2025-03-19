'use client'

import { CreationCard } from '@/components/creation-card'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useCollectionCreations } from '@/hooks/use-collection-creations'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { Loader2, Play } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { id } = useParams()

  const { creations, isLoading: isCollectionLoading } = useCollectionCreations(
    id as string,
  )

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/sign-in')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || isCollectionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !creations.length) {
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen p-4 md:p-8 space-y-4">
        <Button className="gap-x-2" variant="secondary" asChild>
          <Link href={`/${id}/player`}>
            <Play />
            Play Collection
          </Link>
        </Button>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {creations.map((item: CreationV2) => (
            <CreationCard key={item._id} item={item} />
          ))}
        </div>
      </main>
    </>
  )
}
