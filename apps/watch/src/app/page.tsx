import { collectionData } from '../collection.data'
import { CreationCard } from '@/components/creation-card'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  return (
    <main className="min-h-screen p-4 md:p-8 space-y-4">
      <Button className="gap-x-2" variant="secondary" asChild>
        <Link href="/player">
          <Play />
          Play Collection
        </Link>
      </Button>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {collectionData.map(item => (
          <CreationCard key={item._id} item={item} />
        ))}
      </div>
    </main>
  )
}
