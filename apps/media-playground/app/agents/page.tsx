'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AgentsFeed from '@/features/feed/agents-feed'
import { useAuthState } from '@/hooks/use-auth-state'
//import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
//import { useAppDispatch } from '@/stores/store'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

const AgentsPage = () => {
  const { user } = useAuthState()
  //const dispatch = useAppDispatch()

  const [currentTab, setCurrentTab] = useState<'user' | 'public'>('public')
  const [searchQuery, setSearchQuery] = useState('')

  const currentQuery = useMemo(
    () => ({
      limit: 35,
      sort: ['stats.userMessageCount_7d;-1'],
      ...(currentTab === 'user' && user?._id ? { user: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    }),
    [currentTab, user?._id, searchQuery],
  )

  //const handleCreateClick = () => {
  //  dispatch(
  //    updateAgentFormSheet({
  //      isOpen: true,
  //      mode: 'create',
  //    }),
  //  )
  //}

  return (
    <div className="container mx-auto px-4 py-6 max-w-screen-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Explore Agents
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover and chat with AI agents created by the community
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-x-2 text-sm font-semibold bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-purple-600"
            asChild
          >
            <Link title="Create Agent" href="/new/agent">
              <PlusIcon className="size-4" />
              <span>Create Agent</span>
            </Link>
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap flex-col sm:flex-row gap-4 w-full">
          <Tabs
            value={currentTab}
            onValueChange={value => setCurrentTab(value as 'user' | 'public')}
            className="w-full sm:max-w-fit"
          >
            <TabsList className="flex justify-stretch min-w-[328px] w-full md:w-auto md:min-w-[420px]">
              <TabsTrigger value="public" className="w-full">
                Public Agents
              </TabsTrigger>
              <TabsTrigger value="user" className="w-full">
                My Agents
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <FeedSearchForm handleSearch={setSearchQuery} />
        </div>
      </div>

      {/* Agents Grid */}
      <AgentsFeed
        query={currentQuery}
        minCols={1}
        maxCols={5}
        hideCreateButton={true}
        improvedLayout={true}
        hideContextMenu={true}
        breakpoints={[
          { minWidth: 1536, columns: 5 },
          { minWidth: 1280, columns: 4 },
          { minWidth: 1024, columns: 3 },
          { minWidth: 768, columns: 2 },
          { minWidth: 640, columns: 2 },
          { minWidth: 0, columns: 1 },
        ]}
      />
    </div>
  )
}

export default AgentsPage
