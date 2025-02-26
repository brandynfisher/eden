'use client'

import AgentMiniCard from '@/components/card/agent-mini-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useAgentsListQuery } from '@/hooks/query/use-agents-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, LogIn, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useMemo } from 'react'

export default function UserAgentsGrid() {
  const { user, verifyAuth, isLoading: isAuthLoading = false } = useAuthState()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

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

  const onCreated = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKey as unknown as unknown[],
    })
  }

  const handleCreateClick = () => {
    if (!user) {
      verifyAuth()
      return
    }

    dispatch(
      updateAgentFormSheet({
        isOpen: true,
        mode: 'create',
        onAction: onCreated,
      }),
    )
  }

  // Show loading state while auth is being determined
  const isLoadingState = isAuthLoading || isLoading

  // If auth check is complete and user is not logged in, show auth prompt
  const showAuthPrompt = !isAuthLoading && !user

  return (
    <div className="mb-12">
      <div className="flex items-center mb-6 gap-x-2 h-9">
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-xl font-semibold text-center">
            My Agents
          </TypographyH4>
        </div>
        {user && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="ml-auto gap-x-2 text-sm font-medium border-gray-700 hover:bg-gray-800"
          >
            <Link
              href={`/creators/${user?.username}?tab=agents`}
              prefetch={false}
            >
              More
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoadingState ? (
          <>
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
          </>
        ) : showAuthPrompt ? (
          <div
            onClick={verifyAuth}
            className="col-span-full flex flex-col items-center justify-center p-6 text-center bg-muted/20 border border-dashed border-gray-700 rounded-md cursor-pointer transition-all hover:bg-gray-800/30 hover:border-gray-600"
          >
            <p className="text-muted-foreground mb-3">
              Sign in to view your agents
            </p>
            <Button variant="outline" className="gap-x-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        ) : (
          agents?.map(agent => (
            <AgentMiniCard key={agent._id} agent={agent} queryKey={queryKey} />
          ))
        )}
      </div>
      <Button
        variant="outline"
        className={`mt-4 gap-x-2 text-sm font-semibold bg-purple-600/40 hover:bg-purple-600/20 border-purple-600/60 hover:border-purple-600 ${
          !user && !isAuthLoading ? 'opacity-0 pointer-events-none' : ''
        }`}
        onClick={handleCreateClick}
        disabled={!!isAuthLoading}
      >
        <PlusIcon className="w-4 h-4" />
        Create Agent
      </Button>
    </div>
  )
}
