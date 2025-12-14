'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useRefreshDiscordChannels } from '@/hooks/mutation/use-refresh-discord-channels'
import { useDiscordChannelsQuery } from '@/hooks/query/use-discord-channels-query'
import { cn } from '@/lib/utils'
import { DiscordChannelInfo, DiscordGuildInfo } from '@edenlabs/eden-sdk'
import {
  ChevronRight,
  FolderIcon,
  Hash,
  RefreshCw,
  Search,
  Volume2,
} from 'lucide-react'
import { useMemo, useState } from 'react'

// Simple relative time formatter
const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
}

// Channel type constants from Discord API
const CHANNEL_TYPES = {
  TEXT: 0,
  VOICE: 2,
  CATEGORY: 4,
  ANNOUNCEMENT: 5,
  FORUM: 15,
  STAGE: 13,
}

type SelectedChannel = {
  id: string
  note?: string
  readOnly?: boolean
}

interface DiscordChannelSelectorProps {
  agentId: string
  selectedChannels: SelectedChannel[]
  onChannelsChange: (channels: SelectedChannel[]) => void
  isDeployed: boolean
}

const getChannelIcon = (type: number) => {
  switch (type) {
    case CHANNEL_TYPES.VOICE:
    case CHANNEL_TYPES.STAGE:
      return <Volume2 className="h-4 w-4 text-muted-foreground" />
    case CHANNEL_TYPES.CATEGORY:
      return <FolderIcon className="h-4 w-4 text-muted-foreground" />
    default:
      return <Hash className="h-4 w-4 text-muted-foreground" />
  }
}

const ChannelRow = ({
  channel,
  isSelected,
  writeAccess,
  onToggle,
  onWriteAccessChange,
}: {
  channel: DiscordChannelInfo
  isSelected: boolean
  writeAccess: boolean
  onToggle: () => void
  onWriteAccessChange: (value: boolean) => void
}) => {
  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-muted/30 rounded-md">
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      {getChannelIcon(channel.type)}
      <span className="flex-1 truncate text-sm">{channel.name}</span>

      {isSelected && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Enable writing
          </span>
          <Switch
            checked={writeAccess}
            onCheckedChange={onWriteAccessChange}
            className="h-4"
          />
        </div>
      )}
    </div>
  )
}

const CategorySection = ({
  categoryName,
  channels,
  selectedMap,
  onChannelToggle,
  onWriteAccessChange,
  searchQuery,
}: {
  categoryName: string
  channels: DiscordChannelInfo[]
  selectedMap: Map<string, { writeAccess: boolean }>
  onChannelToggle: (channel: DiscordChannelInfo) => void
  onWriteAccessChange: (channelId: string, value: boolean) => void
  searchQuery: string
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const filteredChannels = channels.filter(
    ch =>
      ch.type !== CHANNEL_TYPES.CATEGORY &&
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (filteredChannels.length === 0) return null

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger className="flex items-center w-full px-3 py-1.5 hover:bg-muted/30 rounded-md">
        <ChevronRight
          className={cn(
            'h-3 w-3 mr-1.5 transition-transform text-muted-foreground',
            isExpanded && 'rotate-90',
          )}
        />
        <FolderIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {categoryName}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4">
        {filteredChannels.map(channel => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            isSelected={selectedMap.has(channel.id)}
            writeAccess={selectedMap.get(channel.id)?.writeAccess ?? false}
            onToggle={() => onChannelToggle(channel)}
            onWriteAccessChange={value =>
              onWriteAccessChange(channel.id, value)
            }
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

const GuildSection = ({
  guild,
  selectedMap,
  onChannelToggle,
  onWriteAccessChange,
  searchQuery,
}: {
  guild: DiscordGuildInfo
  selectedMap: Map<string, { writeAccess: boolean }>
  onChannelToggle: (channel: DiscordChannelInfo) => void
  onWriteAccessChange: (channelId: string, value: boolean) => void
  searchQuery: string
}) => {
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false)
  const [iconError, setIconError] = useState(false)

  // Auto-expand when searching
  const isExpanded = searchQuery ? true : !isManuallyCollapsed

  // Group channels by category
  const channelsByCategory = useMemo(() => {
    const groups = new Map<string | null, DiscordChannelInfo[]>()

    for (const channel of guild.channels) {
      if (channel.type === CHANNEL_TYPES.CATEGORY) continue

      const categoryKey = channel.category_id || null
      if (!groups.has(categoryKey)) {
        groups.set(categoryKey, [])
      }
      groups.get(categoryKey)!.push(channel)
    }

    return groups
  }, [guild.channels])

  // Get category names
  const categoryNames = useMemo(() => {
    const names = new Map<string, string>()
    for (const channel of guild.channels) {
      if (channel.type === CHANNEL_TYPES.CATEGORY) {
        names.set(channel.id, channel.name)
      }
    }
    return names
  }, [guild.channels])

  const totalChannels = guild.channels.filter(
    c => c.type !== CHANNEL_TYPES.CATEGORY,
  ).length

  const selectedInGuild = guild.channels.filter(
    c => c.type !== CHANNEL_TYPES.CATEGORY && selectedMap.has(c.id),
  ).length

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={open => setIsManuallyCollapsed(!open)}
      className="border-b last:border-b-0"
    >
      <CollapsibleTrigger className="flex items-center w-full p-3 hover:bg-muted/50">
        <ChevronRight
          className={cn(
            'h-4 w-4 mr-2 transition-transform',
            isExpanded && 'rotate-90',
          )}
        />
        {guild.icon && !iconError ? (
          <img
            src={guild.icon}
            className="h-5 w-5 rounded-full mr-2 object-cover"
            alt={guild.name}
            onError={() => setIconError(true)}
          />
        ) : (
          <div className="h-5 w-5 rounded-full mr-2 bg-primary/20 flex items-center justify-center text-xs font-medium">
            {guild.name[0]}
          </div>
        )}
        <span className="font-medium flex-1 text-left">{guild.name}</span>
        <Badge variant="secondary" className="ml-2">
          {selectedInGuild > 0 ? `${selectedInGuild}/` : ''}
          {totalChannels} channels
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent className="pb-2">
        {/* Uncategorized channels first */}
        {channelsByCategory.get(null)?.map(channel => {
          if (!channel.name.toLowerCase().includes(searchQuery.toLowerCase()))
            return null
          return (
            <div key={channel.id} className="pl-6">
              <ChannelRow
                channel={channel}
                isSelected={selectedMap.has(channel.id)}
                writeAccess={selectedMap.get(channel.id)?.writeAccess ?? false}
                onToggle={() => onChannelToggle(channel)}
                onWriteAccessChange={value =>
                  onWriteAccessChange(channel.id, value)
                }
              />
            </div>
          )
        })}

        {/* Then categories with their channels */}
        {[...channelsByCategory.entries()]
          .filter(([key]) => key !== null)
          .sort((a, b) => (a[1][0]?.position ?? 0) - (b[1][0]?.position ?? 0))
          .map(([categoryId, channels]) => (
            <div key={categoryId} className="pl-4">
              <CategorySection
                categoryName={
                  categoryNames.get(categoryId!) || 'Unknown Category'
                }
                channels={channels}
                selectedMap={selectedMap}
                onChannelToggle={onChannelToggle}
                onWriteAccessChange={onWriteAccessChange}
                searchQuery={searchQuery}
              />
            </div>
          ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

const ChannelsSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-2 p-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-5 w-16" />
      </div>
    ))}
  </div>
)

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Hash className="h-10 w-10 text-muted-foreground mb-3" />
    <h4 className="text-sm font-medium mb-1">No channels found</h4>
    <p className="text-xs text-muted-foreground mb-4">
      Click refresh to load channels from Discord
    </p>
    <Button variant="outline" size="sm" onClick={onRefresh}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh Channels
    </Button>
  </div>
)

export const DiscordChannelSelector = ({
  agentId,
  selectedChannels,
  onChannelsChange,
  isDeployed,
}: DiscordChannelSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')

  const { guilds, isLoading, lastRefreshedAt } = useDiscordChannelsQuery({
    agentId,
    enabled: isDeployed,
  })
  const refreshMutation = useRefreshDiscordChannels(agentId)

  // Convert selected channels to a map for easy lookup
  const selectedMap = useMemo(() => {
    const map = new Map<string, { writeAccess: boolean }>()
    for (const channel of selectedChannels) {
      map.set(channel.id, { writeAccess: !channel.readOnly })
    }
    return map
  }, [selectedChannels])

  const handleChannelToggle = (channel: DiscordChannelInfo) => {
    if (selectedMap.has(channel.id)) {
      // Remove channel
      onChannelsChange(selectedChannels.filter(c => c.id !== channel.id))
    } else {
      // Add channel with default readOnly = true (no write access)
      onChannelsChange([
        ...selectedChannels,
        { id: channel.id, note: channel.name, readOnly: true },
      ])
    }
  }

  const handleWriteAccessChange = (channelId: string, writeAccess: boolean) => {
    onChannelsChange(
      selectedChannels.map(c =>
        c.id === channelId ? { ...c, readOnly: !writeAccess } : c,
      ),
    )
  }

  if (!isDeployed) {
    return (
      <div className="rounded-lg border p-4 text-center text-muted-foreground text-sm">
        Deploy your Discord bot first to see available channels
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Channel List Container */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header with Search and Refresh */}
        <div className="bg-muted/30 p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="h-8"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  refreshMutation.isPending && 'animate-spin',
                )}
              />
            </Button>
          </div>
          {lastRefreshedAt && (
            <p className="text-xs text-muted-foreground">
              Updated {getRelativeTime(new Date(lastRefreshedAt))}
            </p>
          )}
        </div>

        {/* Guild/Channel Tree */}
        <div className="max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <ChannelsSkeleton />
          ) : !guilds?.length ? (
            <EmptyState onRefresh={() => refreshMutation.mutate()} />
          ) : (
            guilds.map(guild => (
              <GuildSection
                key={guild.id}
                guild={guild}
                selectedMap={selectedMap}
                onChannelToggle={handleChannelToggle}
                onWriteAccessChange={handleWriteAccessChange}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      </div>

      {/* Selected Summary */}
      <div className="text-sm text-muted-foreground">
        {selectedChannels.length} channels selected (
        {selectedChannels.filter(c => !c.readOnly).length} with write access)
      </div>
    </div>
  )
}
