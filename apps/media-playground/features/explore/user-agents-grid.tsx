'use client'

import AgentMiniCard from '@/components/card/agent-mini-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useAgentsListQuery } from '@/hooks/query/use-agents-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useMemo } from 'react'

export default function UserAgentsGrid() {
  const { user } = useAuthState()
  const pathname = usePathname()

  const queryOptions = useMemo(
    () => ({
      enabled: !!user?._id,
      owner: user?._id,
      limit: 5,
    }),
    [user?._id],
  )

  const { agents, isLoading } = useAgentsListQuery(queryOptions)

  // Create a stable queryKey for the agents list
  const queryKey = useMemo(
    () => ['agents', { owner: user?._id, limit: 5, path: pathname }],
    [user?._id, pathname],
  )

  if (!user) return null

  return (
    <>
      <div className="flex items-center mb-6 gap-x-2">
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-2xl font-semibold text-center">
            My Agents
          </TypographyH4>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="ml-auto gap-x-2 text-sm font-semibold bg-purple-600/40 hover:bg-purple-600/20 border-purple-600/60 hover:border-purple-600"
        >
          <Link href={`/creators/${user?._id}?tab=agents`} prefetch={false}>
            More
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
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
        {agents?.map(agent => (
          <AgentMiniCard key={agent._id} agent={agent} queryKey={queryKey} />
        ))}
      </div>
    </>
  )
}
