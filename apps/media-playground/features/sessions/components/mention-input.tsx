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
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const filteredAgents =
    search.trim() && search.trim() !== '@'
      ? agents.filter(
          agent =>
            agent.username.toLowerCase().includes(search.toLowerCase()) ||
            (agent.name &&
              agent.name.toLowerCase().includes(search.toLowerCase())),
        )
      : agents

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
          onValueChange={val => setSearch(val.replace(/^@+/, ''))}
        />
        <CommandEmpty>No agent found.</CommandEmpty>
        <CommandGroup>
          {filteredAgents.map(agent => (
            <CommandItem
              key={agent._id}
              value={agent.username}
              onSelect={currentValue => {
                setValue(currentValue)
                onSelect(agent)
              }}
              className="flex items-center gap-2 px-4 py-2"
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
