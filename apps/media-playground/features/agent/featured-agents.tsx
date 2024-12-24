'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { AgentGridSection } from '@/features/tools/agent-grid-section'
import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export const FeaturedAgents = () => {
  return (
    <div className="p-2 md:p-4 pt-3 mt-4 rounded-lg bg-muted-darker">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>Agents</div>
        <Link
          title="Explore agent feed"
          href="/explore?tab=agents"
          className="text-muted-foreground flex items-center gap-0.5 hover:text-foreground  group transition-colors duration-200"
          prefetch={false}
        >
          Explore more
          <ChevronRightIcon className="w-4 h-4 transform  group-hover:scale-110" />
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton className="min-h-48 w-full" />
            <Skeleton className="min-h-48 w-full" />
            <Skeleton className="min-h-48 w-full" />
            <Skeleton className="min-h-48 w-full" />
          </div>
        }
      >
        {/* //@todo: configurable set per ENV prod/stage OR DB identifier for feature list (better) */}
        <AgentGridSection
          agentIds={[
            '675fd3af79e00297cdac1324', // eve
            '675f87f379e00297cd9b4396', // oppenheimer
            '675f880079e00297cd9b45d9', // Eden444
          ]}
        />
      </Suspense>
    </div>
  )
}
