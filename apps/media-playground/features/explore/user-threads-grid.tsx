'use client'

import { ThreadMiniCard } from '@/components/card/thread-mini-card'
import ErrorBoundary from '@/components/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import React from 'react'

export default function UserThreadsGrid() {
  const { user } = useAuthState()

  const { threads, isLoading } = useThreadListQuery({
    enabled: !!user?._id,
    limit: 5,
  })

  if (!user) return null

  return (
    <ErrorBoundary>
      <div className="flex items-center mb-6 gap-x-2 mt-4">
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-xl font-semibold text-center">
            Recent Threads
          </TypographyH4>
        </div>
        {/* <Button
          asChild
          size="sm"
          variant="outline"
          className="ml-auto gap-x-2 text-sm font-semibold bg-purple-600/40 hover:bg-purple-600/20 border-purple-600/60 hover:border-purple-600"
        >
          <Link href={`/creators/${user?._id}?tab=threads`}>
            More
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button> */}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
        {isLoading ? (
          <>
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-full h-24" />
          </>
        ) : null}
        {threads
          ?.filter(thread => thread !== undefined)
          .map(thread => (
            <ThreadMiniCard key={thread._id} thread={thread} />
          ))}
      </div>
    </ErrorBoundary>
  )
}
