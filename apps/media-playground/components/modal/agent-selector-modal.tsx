'use client'

import ToggleButton from '@/components/button/toggle-button'
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
import { ToggleGroup } from '@/components/ui/toggle-group'
import AgentsFeed from '@/features/feed/agents-feed'
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
        // Add agent if not selected
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
        className={cn([`overflow-x-hidden flex flex-col max-w-7xl`, className])}
      >
        <DialogHeader className="mt-4">
          <div className="flex gap-4 items-center">
            <DialogTitle className="py-2">
              {title || 'Select Agents'}
            </DialogTitle>
            {tempSelectedAgents.length > 0 && (
              <Badge variant="secondary">
                {tempSelectedAgents.length} selected
              </Badge>
            )}
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1">
          <div className="flex flex-col items-center sm:flex-row gap-2 mb-4">
            <ToggleGroup
              type="single"
              value={currentTab}
              className="w-full border border-muted rounded-lg p-1 flex items-center sm:max-w-fit bg-popover"
            >
              <ToggleButton
                className="w-full sm:w-32 h-8"
                value={'user'}
                label={'My Agents'}
                onClick={() => setCurrentTab('user')}
              />
              <ToggleButton
                className="w-full sm:w-32 h-8"
                value={'public'}
                label={'Public Agents'}
                onClick={() => setCurrentTab('public')}
              />
            </ToggleGroup>
            <FeedSearchForm handleSearch={setSearchQuery} />
          </div>

          <AgentsFeed
            query={currentQuery}
            minCols={1}
            maxCols={3}
            onClick={handleAgentToggle}
            isSelectable={true}
            selectedIds={selectedAgentIds}
            scrollRef={scrollRef}
            hideCreateButton={true}
          />
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 rounded-lg bg-background border border-border p-4 mt-4 flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {tempSelectedAgents.length} agent
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
      </DialogContentScrollable>
    </Dialog>
  )
}

export default AgentSelectorModal
