'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ToolHoverMenu } from '@/features/sessions/components/tool-hover-menu'
import { fetcher } from '@/lib/fetcher'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { AgentGetResponse, TaskV2Args, TaskV2Result } from '@edenlabs/eden-sdk'
import { useQueries } from '@tanstack/react-query'
import { BotIcon } from 'lucide-react'
import React, { useMemo } from 'react'

export type ConductVoteEmbedProps = {
  results: TaskV2Result[]
  toolName?: string
  toolArgs?: TaskV2Args
}

type Vote = {
  voter: string
  choice: string
}

type VoteResult = {
  status: string
  topic: string
  tally: Record<string, number>
  votes: Vote[]
}

export const ConductVoteEmbed: React.FC<ConductVoteEmbedProps> = ({
  results,
  toolName,
  toolArgs,
}) => {
  // Extract vote data from results
  const voteData = useMemo<VoteResult | null>(() => {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return null
    }

    for (const result of results) {
      // Check if result has output with vote data
      if (result && result.output && typeof result.output === 'object') {
        // Handle array output
        if (Array.isArray(result.output)) {
          for (const item of result.output) {
            if (
              item &&
              typeof item === 'object' &&
              'topic' in item &&
              'votes' in item
            ) {
              return item as unknown as VoteResult
            }
          }
        } else {
          // Handle object output directly
          const output = result.output as unknown as Record<string, unknown>
          if ('topic' in output && 'votes' in output) {
            return output as unknown as VoteResult
          }
        }
      }

      // Also check result directly
      if (result && typeof result === 'object') {
        const obj = result as unknown as Record<string, unknown>
        if ('topic' in obj && 'votes' in obj) {
          return obj as unknown as VoteResult
        }
      }
    }

    return null
  }, [results])

  // Get unique voter usernames
  const voterUsernames = useMemo(() => {
    if (!voteData?.votes) return []
    return [...new Set(voteData.votes.map(v => v.voter))]
  }, [voteData])

  // Fetch agent data for all voters in parallel
  const agentQueries = useQueries({
    queries: voterUsernames.map(username => ({
      queryKey: ['agents', username],
      queryFn: () => fetcher<AgentGetResponse>(`/api/agents/${username}`),
      enabled: !!username,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })),
  })

  // Create a map of username to agent data
  const agentMap = useMemo(() => {
    const map: Record<
      string,
      { name?: string; username: string; userImage?: string }
    > = {}
    voterUsernames.forEach((username, index) => {
      const query = agentQueries[index]
      if (query.data?.agent) {
        map[username] = {
          name: query.data.agent.name,
          username: query.data.agent.username || username,
          userImage: query.data.agent.userImage,
        }
      } else {
        map[username] = { username }
      }
    })
    return map
  }, [voterUsernames, agentQueries])

  // If no vote data, don't render
  if (!voteData) {
    return null
  }

  // Calculate winner(s) from tally
  const maxVotes = Math.max(...Object.values(voteData.tally || {}), 0)
  const winners = Object.entries(voteData.tally || {})
    .filter(([, count]) => count === maxVotes && count > 0)
    .map(([choice]) => choice)

  return (
    <div className="space-y-2">
      {/* Vote results card */}
      <div className="rounded-lg border border-border/50 bg-card p-4">
        {/* Topic/Question */}
        <p className="text-sm text-muted-foreground mb-4">{voteData.topic}</p>

        {/* Individual votes */}
        <div className="space-y-2">
          {voteData.votes.map((vote, index) => {
            const agent = agentMap[vote.voter]
            const avatarUrl = agent?.userImage
              ? getCloudfrontOriginalUrl(agent.userImage)
              : undefined
            const displayName = agent?.name || vote.voter

            return (
              <div key={index} className="flex items-center gap-3">
                {/* Voter avatar */}
                <Avatar className="w-6 h-6 border border-border shrink-0">
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs">
                    {avatarUrl ? (
                      displayName.slice(0, 2).toUpperCase()
                    ) : (
                      <BotIcon className="w-3 h-3 text-muted-foreground" />
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Voter name */}
                <span className="text-sm font-medium">{displayName}</span>

                {/* "voted for" text */}
                <span className="text-xs text-muted-foreground">voted for</span>

                {/* Choice badge */}
                <Badge
                  variant={
                    winners.includes(vote.choice) ? 'default' : 'secondary'
                  }
                  className="text-xs"
                >
                  {vote.choice}
                </Badge>
              </div>
            )
          })}
        </div>

        {/* Tally summary */}
        {voteData.tally && Object.keys(voteData.tally).length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Tally</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(voteData.tally)
                .sort(([, a], [, b]) => b - a)
                .map(([choice, count]) => (
                  <Badge
                    key={choice}
                    variant={winners.includes(choice) ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {choice}: {count}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Tool hover menu at bottom right */}
      {toolName && toolArgs && (
        <div className="flex justify-end">
          <ToolHoverMenu toolName={toolName} args={toolArgs} result={results} />
        </div>
      )}
    </div>
  )
}
