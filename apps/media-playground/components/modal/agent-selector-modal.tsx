'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogContentScrollable } from '@/components/ui/custom/dialog-content-scrollable'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AgentsFeed from '@/features/feed/agents-feed'
import { MAX_AGENTS } from '@/features/sessions/session-config'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { CheckIcon, XIcon } from 'lucide-react'
import { PropsWithChildren, ReactNode, useRef, useState } from 'react'

type Props = {
  title?: ReactNode
  description?: ReactNode
  className?: string
  trigger?: ReactNode
  selectedAgents?: Agent[]
  onChange: (agents: Agent[]) => void
  query?: FeedAgentCursorArguments
} & PropsWithChildren

const AgentSelectorModal = ({
  title,
  description,
  className,
  trigger,
  selectedAgents = [],
  onChange,
  query: queryProp,
}: Props) => {
  const { user } = useAuthState()

  const [open, setOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<'user' | 'public'>('user')
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelectedAgents, setTempSelectedAgents] =
    useState<Agent[]>(selectedAgents)

  const handleAgentToggle = (agent: Agent) => {
    setTempSelectedAgents(prev => {
      const existingIndex = prev.findIndex(a => a._id === agent._id)
      if (existingIndex !== -1) {
        // Remove agent if already selected
        return prev.filter(a => a._id !== agent._id)
      } else {
        // Check if we're at the maximum limit
        if (prev.length >= MAX_AGENTS) {
          return prev // Don't add if at limit
        }
        // Add agent if not selected and under limit
        return [...prev, agent]
      }
    })
  }

  const handleConfirm = () => {
    onChange(tempSelectedAgents)
    setOpen(false)
  }

  const handleCancel = () => {
    setTempSelectedAgents(selectedAgents)
    setOpen(false)
  }

  const scrollRef = useRef<HTMLDivElement>(null)

  const onOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      setSearchQuery('')
      setTempSelectedAgents(selectedAgents)
    }
  }

  const baseQuery = queryProp || {}
  const currentQuery = {
    ...baseQuery,
    ...(currentTab === 'user' && user?._id ? { user: user._id } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  }

  // Get selected agent IDs for feed component
  const selectedAgentIds = tempSelectedAgents.map(agent => agent._id)
  const isAtLimit = tempSelectedAgents.length >= MAX_AGENTS

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" className="mt-2">
            Select agents{' '}
            {selectedAgents.length > 0 && `(${selectedAgents.length})`}
          </Button>
        )}
      </DialogTrigger>
      <DialogContentScrollable
        ref={scrollRef}
        className={cn([
          `w-[90vw] max-w-[90vw] h-[85vh] overflow-x-hidden flex flex-col`,
          className,
        ])}
      >
        <DialogHeader className="mt-4">
          <div className="flex gap-4 items-center">
            <DialogTitle className="py-2">
              {title || 'Select Agents'}
            </DialogTitle>
            {tempSelectedAgents.length > 0 && (
              <Badge variant="secondary">
                {tempSelectedAgents.length}/{MAX_AGENTS} selected
              </Badge>
            )}
          </div>
          <DialogDescription>
            {description}
            {isAtLimit && (
              <div className="text-amber-600 dark:text-amber-400 mt-1">
                Maximum of {MAX_AGENTS} agents reached. Deselect an agent to
                choose a different one.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Tabs
                value={currentTab}
                onValueChange={value =>
                  setCurrentTab(value as 'user' | 'public')
                }
                className="w-full sm:max-w-fit"
              >
                <TabsList className="w-full border border-muted rounded-lg p-1 bg-popover">
                  <TabsTrigger value="user" className="w-full sm:w-32 h-8">
                    My Agents
                  </TabsTrigger>
                  <TabsTrigger value="public" className="w-full sm:w-32 h-8">
                    Public Agents
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <FeedSearchForm handleSearch={setSearchQuery} />
            </div>
          </div>

          <div className="flex-1 min-h-0 mb-4">
            <AgentsFeed
              query={currentQuery}
              minCols={1}
              maxCols={5}
              breakpoints={[
                { minWidth: 1536, columns: 5 }, // Very wide screens - 5 columns max
                { minWidth: 1280, columns: 4 }, // Wide screens - 4 columns
                { minWidth: 1024, columns: 3 }, // Large desktop - 3 columns
                { minWidth: 768, columns: 2 }, // Tablet - 2 columns
                { minWidth: 640, columns: 2 }, // Large mobile - 2 columns
                { minWidth: 0, columns: 1 }, // Small mobile - 1 column
              ]}
              onClick={handleAgentToggle}
              isSelectable={true}
              selectedIds={selectedAgentIds}
              scrollRef={scrollRef}
              hideCreateButton={true}
              hideContextMenu={true}
              improvedLayout={true}
            />
          </div>

          {/* Footer - positioned at bottom of modal */}
          <div className="rounded-lg bg-background border border-border p-4 flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {tempSelectedAgents.length}/{MAX_AGENTS} agent
              {tempSelectedAgents.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} size="sm">
                <XIcon className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                size="sm"
                disabled={tempSelectedAgents.length === 0}
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      </DialogContentScrollable>
    </Dialog>
  )
}

export default AgentSelectorModal
