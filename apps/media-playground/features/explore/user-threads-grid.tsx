'use client'

import { ThreadMiniCard } from '@/components/card/thread-mini-card'
import ErrorBoundary from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { Thread } from '@edenlabs/eden-sdk'
import { LogIn } from 'lucide-react'
import React from 'react'

export default function UserThreadsGrid() {
  const { user, verifyAuth, isLoading: isAuthLoading } = useAuthState()

  const { threads, isLoading } = useThreadListQuery({
    enabled: !!user?._id,
    limit: 6,
  })

  const isLoadingState = isAuthLoading || isLoading
  const showAuthPrompt = !isAuthLoading && !user
  const filteredThreads = threads?.filter(thread => thread !== undefined) || []

  return (
    <ErrorBoundary>
      <div className="flex items-center mb-6 gap-x-2 mt-4 h-9">
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-xl font-semibold text-center">
            Recent Threads
          </TypographyH4>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
        {isLoadingState ? (
          <>
            <Skeleton className="w-full h-[58px]" />
            <Skeleton className="w-full h-[58px]" />
            <Skeleton className="w-full h-[58px]" />
            <Skeleton className="w-full h-[58px] hidden md:flex" />
            <Skeleton className="w-full h-[58px] hidden md:flex" />
            <Skeleton className="w-full h-[58px] hidden md:flex" />
          </>
        ) : showAuthPrompt ? (
          <div
            onClick={verifyAuth}
            className="col-span-full flex flex-col items-center justify-center p-6 text-center bg-muted/20 border border-dashed border-gray-700 rounded-md cursor-pointer transition-all hover:bg-gray-800/30 hover:border-gray-600"
          >
            <p className="text-muted-foreground mb-3">
              Sign in to view your recent threads
            </p>
            <Button variant="outline" className="gap-x-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        ) : (
          <>
            {filteredThreads.slice(0, 3).map(thread => (
              <ThreadMiniCard key={thread?._id} thread={thread as Thread} />
            ))}
            {filteredThreads.slice(3, 6).map(thread => (
              <ThreadMiniCard
                key={thread?._id}
                thread={thread as Thread}
                className="hidden md:flex"
              />
            ))}
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
