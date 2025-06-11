'use client'

import ToggleButton from '@/components/button/toggle-button'
import FeedSearchForm from '@/components/filter/feed-search-form'
import { Button } from '@/components/ui/button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import AgentsFeed from '@/features/feed/agents-feed'
import { useAuthState } from '@/hooks/use-auth-state'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { PlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

const AgentsPage = () => {
  const { user } = useAuthState()
  const dispatch = useAppDispatch()

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

  const handleCreateClick = () => {
    dispatch(
      updateAgentFormSheet({
        isOpen: true,
        mode: 'create',
      }),
    )
  }

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
            onClick={handleCreateClick}
            variant="outline"
            className="gap-x-2 text-sm font-semibold bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-purple-600"
          >
            <PlusIcon className="size-4" />
            Create Agent
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center sm:flex-row gap-4">
          <ToggleGroup
            type="single"
            value={currentTab}
            className="w-full border border-border rounded-lg p-1 flex items-center sm:max-w-fit bg-card"
          >
            <ToggleButton
              className="w-full sm:w-32 h-9"
              value="public"
              label="Public Agents"
              onClick={() => setCurrentTab('public')}
            />
            <ToggleButton
              className="w-full sm:w-32 h-9"
              value="user"
              label="My Agents"
              onClick={() => setCurrentTab('user')}
            />
          </ToggleGroup>
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
