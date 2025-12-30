'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetcher } from '@/lib/fetcher'
import { CreatorsGetResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

interface Reaction {
  userId: string
  reaction: string
}

interface ReactionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reactions: Reaction[]
}

// Component to fetch and display a single user's info
// Strip platform prefixes from usernames
const stripPlatformPrefix = (username: string): string => {
  return username.replace(/^(discord_|telegram_|twitter_|farcaster_)/i, '')
}

const UserReactionRow = ({
  userId,
  reaction,
  enabled,
}: {
  userId: string
  reaction: string
  enabled: boolean
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      try {
        const res = await fetcher<CreatorsGetResponse>(`/api/users/${userId}`)
        return res?.creator
      } catch {
        return null
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  })

  const rawUsername = data?.username || userId
  const username = stripPlatformPrefix(rawUsername)
  const userImage = data?.userImage

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {userImage && <AvatarImage src={userImage} alt={username} />}
          <AvatarFallback className="text-xs">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              username.slice(0, 2).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm truncate">{username}</span>
      </div>
      <span className="text-xl flex-shrink-0 ml-2">{reaction}</span>
    </div>
  )
}

export const ReactionsModal = ({
  open,
  onOpenChange,
  reactions,
}: ReactionsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Reactions ({reactions.length})</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[300px] px-2 pb-4">
          <div className="space-y-1">
            {reactions.map((item, index) => (
              <UserReactionRow
                key={`${item.userId}-${index}`}
                userId={item.userId}
                reaction={item.reaction}
                enabled={open}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
