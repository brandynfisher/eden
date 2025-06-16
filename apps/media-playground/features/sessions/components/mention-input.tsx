import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface MentionInputProps {
  agents: Agent[]
  onSelect: (agent: Agent) => void
  onClose: () => void
}

export const MentionInput = ({
  agents,
  onSelect,
  onClose,
}: MentionInputProps) => {
  const [value, setValue] = useState('')
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredAgents =
    search.trim() && search.trim() !== '@'
      ? agents.filter(
          agent =>
            agent.username.toLowerCase().includes(search.toLowerCase()) ||
            (agent.name &&
              agent.name.toLowerCase().includes(search.toLowerCase())),
        )
      : agents

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    setSearch('')
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!filteredAgents.length) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex(prev => (prev + 1) % filteredAgents.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex(prev =>
          prev === 0 ? filteredAgents.length - 1 : prev - 1,
        )
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const agent = filteredAgents[activeIndex]
        if (agent) {
          setValue(agent.username)
          onSelect(agent)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [filteredAgents, activeIndex, onSelect, onClose])

  return (
    <div
      ref={containerRef}
      className="w-[300px] p-0 bg-popover rounded-md border"
    >
      <Command>
        <CommandInput
          ref={inputRef}
          placeholder="Search agents..."
          value={search}
          onValueChange={val => {
            setSearch(val.replace(/^@+/, ''))
            setActiveIndex(0)
          }}
        />
        <CommandEmpty>No agent found.</CommandEmpty>
        <CommandGroup>
          {filteredAgents.map((agent, index) => (
            <CommandItem
              key={agent._id}
              value={agent.username}
              onSelect={() => {
                setValue(agent.username)
                onSelect(agent)
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 cursor-pointer',
                index === activeIndex && 'bg-accent',
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={agent.avatar_url} alt={agent.username} />
                <AvatarFallback>
                  {agent.username.slice(0, 2).toUpperCase()}
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
              <Check
                className={cn(
                  'ml-auto h-4 w-4',
                  value === agent.username ? 'opacity-100' : 'opacity-0',
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </div>
  )
}
