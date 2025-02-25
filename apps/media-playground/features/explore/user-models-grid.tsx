'use client'

// import { useAuthState } from '@/hooks/use-auth-state'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
// import { useAgentsQuery } from '@/hooks/query/use-agents-query'
import React from 'react'

export default function UserModelsGrid() {
  // const { user } = useAuthState()

  // const { data: agents } = useAgentsQuery({
  //   queryKey: ['agents', user?._id],
  //   queryFn: () => getAgents({ user: user?._id }),
  // })

  return (
    <>
      <div className="flex items-center justify-between mt-2">
        <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
          My Models
        </TypographyH4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-48" />
        {/* {agents?.map((agent) => (
        <AgentCard key={agent._id} agent={agent} queryKey={queryKey} />
      ))} */}
      </div>
    </>
  )
}
