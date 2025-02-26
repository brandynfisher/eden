'use client'

import CardImage from '@/components/card/components/card-image'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Thread } from '@edenlabs/eden-sdk'
import { useTimeAgo } from 'next-timeago'
import Link from 'next/link'
import React from 'react'

export const ThreadMiniCard = ({ thread }: { thread: Thread }) => {
  const { TimeAgo } = useTimeAgo()
  return (
    <Link
      href={`/chat/${thread.agent.username}/${thread._id}`}
      prefetch={false}
      className="relative flex overflow-hidden w-full bg-muted/30 border border-border rounded-lg p-2 hover:border-purple-600/40 hover:bg-purple-600/20 transition-all duration-200"
    >
      {/* <div className="flex-shrink-0 flex items-center justify-center"> */}
      <div className="relative rounded-lg overflow-hidden w-10 aspect-square">
        <CardImage
          media={{
            url: getCloudfrontOriginalUrl(thread.agent.userImage),
            thumbnail: getCloudfrontOriginalUrl(thread.agent.userImage),
            width: 256,
            height: 256,
            type: 'image',
            blurhash: thread.agent.blurhash,
          }}
          unoptimized={true}
          className="object-cover "
        />
      </div>
      {/* </div> */}

      <div className="flex-grow min-w-0 flex flex-col gap-1 ml-2">
        <p className="font-semibold text-sm  truncate">
          {thread.title || 'Untitled Thread'}
        </p>
        <div className="flex items-center text-xs text-accent-foreground">
          <span className="truncate">{thread.agent.name}</span>
          <span className="text-muted-foreground ml-auto flex-shrink-0">
            <TimeAgo date={thread.updatedAt} locale="en-short" /> ago
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function UserThreadsGrid() {
  const { user } = useAuthState()

  const { threads, isLoading } = useThreadListQuery({
    enabled: !!user?._id,
    limit: 5,
  })

  return (
    <>
      <div className="flex items-center mb-6 gap-x-2 mt-4">
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-2xl font-semibold text-center">
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
    </>
  )
}
