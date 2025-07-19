import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Command,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

interface MentionInputProps {
  agents: Agent[]
  onSelect: (agent: Agent) => void
  onClose: () => void
  searchFilter?: string
}

export interface MentionInputRef {
  handleKeyDown: (event: React.KeyboardEvent) => boolean
}

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(({
  agents,
  onSelect,
  onClose,
  searchFilter = '',
}, ref) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Create virtual @agent option for all agents
  const allAgentsOption = {
    _id: 'all-agents',
    username: 'agent',
    name: 'All Agents',
    userImage: undefined,
  } as Agent

  const filteredAgents = searchFilter.trim()
    ? [
        // Always include @agent option if it matches the search
        ...(allAgentsOption.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
        allAgentsOption.name.toLowerCase().includes(searchFilter.toLowerCase())
          ? [allAgentsOption]
          : []),
        // Include regular agents that match
        ...agents.filter(
          agent =>
            agent.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
            (agent.name &&
              agent.name.toLowerCase().includes(searchFilter.toLowerCase())),
        ),
      ]
    : [allAgentsOption, ...agents]

  // Reset active index when search filter changes
  useEffect(() => {
    setActiveIndex(0)
    setHoveredIndex(null)
  }, [searchFilter])

  const handleKeyDownInternal = useCallback((event: React.KeyboardEvent): boolean => {
    if (!filteredAgents.length) return false

    if (event.key === 'ArrowDown') {
      setHoveredIndex(null)
      setActiveIndex(prev => (prev + 1) % filteredAgents.length)
      return true
    } else if (event.key === 'ArrowUp') {
      setHoveredIndex(null)
      setActiveIndex(prev =>
        prev === 0 ? filteredAgents.length - 1 : prev - 1,
      )
      return true
    } else if (event.key === 'Enter') {
      const agent = filteredAgents[activeIndex]
      if (agent) {
        onSelect(agent)
      }
      return true
    } else if (event.key === 'Escape') {
      onClose()
      return true
    }
    
    return false
  }, [filteredAgents, activeIndex, onSelect, onClose])

  useImperativeHandle(ref, () => ({
    handleKeyDown: handleKeyDownInternal,
  }), [handleKeyDownInternal])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <div
      ref={containerRef}
      className="w-[300px] p-0 bg-popover rounded-md border"
    >
      <Command>
        {filteredAgents.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No agent found.
          </div>
        )}
        <CommandGroup
          onMouseLeave={() => setHoveredIndex(null)} // clears mouse highlight
        >
          {filteredAgents.map((agent, index) => {
            const isHovered = hoveredIndex === index
            const isActive = hoveredIndex === null && index === activeIndex

            return (
              <CommandItem
                key={agent._id}
                value={agent.username}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onSelect={() => {
                  onSelect(agent)
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 cursor-pointer',
                  (isHovered || isActive) && 'bg-accent',
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={agent.userImage ? getCloudfrontUrl(agent.userImage) : undefined} 
                    alt={agent.username} 
                  />
                  <AvatarFallback>
                    {agent._id === 'all-agents' ? '👥' : agent.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{agent.username}</span>
                  {agent.name && (
                    <span className="text-sm text-muted-foreground">
                      {agent.name}
                    </span>
                  )}
                </div>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </Command>
    </div>
  )
})

MentionInput.displayName = 'MentionInput'
