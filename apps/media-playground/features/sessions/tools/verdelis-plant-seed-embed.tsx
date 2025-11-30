'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import InlineSessionCard from '@/components/session/inline-session-card'
import TextClampMore from '@/components/text/text-clamp-more'
import { AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ToolHoverMenu } from '@/features/sessions/components/tool-hover-menu'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import {
  TaskV2Args,
  TaskV2Result,
  TaskV2Status,
  ToolCallReaction,
  VerdelisSeedV2,
} from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Loader2, SendIcon, Sparkles, XIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'

export type VerdelisPlantSeedEmbedProps = {
  results: TaskV2Result[]
  childSessionId?: string
  toolStatus?: TaskV2Status | string | null
  onCancel?: () => void
  toolName?: string
  toolArgs?: TaskV2Args
  error?: string
  onSessionClick?: (sessionId: string) => void
  messageId?: string
  toolCallId?: string
  existingReactions?: ToolCallReaction[]
}

// Extract seed ID from tool results
const extractSeedId = (results: TaskV2Result[]): string | null => {
  for (const result of results || []) {
    if (!result?.output) continue

    const output = result.output as unknown

    // Handle array output
    if (Array.isArray(output)) {
      for (const item of output) {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>
          // Check for artifact_id field specifically
          const id = obj.artifact_id || obj.artifactId || obj._id || obj.id
          if (typeof id === 'string' && id.length === 24) return id
        }
      }
    }

    // Handle object output
    if (
      typeof output === 'object' &&
      output !== null &&
      !Array.isArray(output)
    ) {
      const obj = output as Record<string, unknown>
      const id = obj.artifact_id || obj.artifactId || obj._id || obj.id
      if (typeof id === 'string' && id.length === 24) return id
    }
  }
  return null
}

// Fetch seed data from API
const fetchVerdelisSeed = async (seedId: string): Promise<VerdelisSeedV2> => {
  const response = await fetch(`/api/verdelis-seeds/${seedId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch seed')
  }
  const data = await response.json()
  return data.seed
}

export const VerdelisPlantSeedEmbed: React.FC<VerdelisPlantSeedEmbedProps> = ({
  results,
  childSessionId,
  toolStatus,
  onCancel,
  toolName = 'verdelis_plant_seed',
  toolArgs,
  error,
  onSessionClick,
  messageId,
  toolCallId,
  existingReactions,
}) => {
  const params = useParams()
  const currentSessionId = params?.id as string | undefined

  const [reactionText, setReactionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reactions, setReactions] = useState<ToolCallReaction[]>(
    Array.isArray(existingReactions) ? existingReactions : [],
  )

  const handleSubmitReaction = async () => {
    if (!messageId || !toolCallId) {
      toast.error('Cannot submit reaction', {
        description: 'Missing message or tool call information',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post('/api/sessions/tool-react', {
        message_id: messageId,
        tool_call_id: toolCallId,
        reaction: reactionText,
      })

      if (response.data.success) {
        const newReaction: ToolCallReaction = {
          user_id: 'current_user',
          reaction: reactionText,
          createdAt: new Date(),
        }
        setReactions(prev => {
          const filtered = prev.filter(r => r.user_id !== newReaction.user_id)
          return [...filtered, newReaction]
        })
        setReactionText('')
        toast.success('Reaction submitted')
      }
    } catch (err) {
      toast.error('Failed to submit reaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Extract session ID from results or use the provided childSessionId
  const sessionId = React.useMemo(() => {
    if (childSessionId) return childSessionId
    if (!results || !Array.isArray(results) || results.length === 0) return null

    for (const result of results) {
      // Check if result.output has session field
      if (result && result.output && typeof result.output === 'object') {
        if (Array.isArray(result.output)) {
          for (const output of result.output) {
            if (output && typeof output === 'object' && 'session' in output) {
              return (output as { session: string }).session
            }
          }
        } else {
          const output = result.output as Record<string, unknown>
          if ('session' in output && typeof output.session === 'string') {
            return output.session
          }
        }
      }
    }
    return null
  }, [results, childSessionId])

  // Extract seed ID from results
  const seedId = React.useMemo(() => extractSeedId(results), [results])

  // Fetch the posted session
  const { data: session, isLoading: isSessionLoading } = useSessionQuery({
    sessionId: sessionId || undefined,
    enabled: !!sessionId,
  })

  // Fetch the current session to get its agents
  const { data: currentSession } = useSessionQuery({
    sessionId: currentSessionId || undefined,
    enabled: !!currentSessionId,
  })

  // Fetch seed data if seed ID is available
  const { data: seed, isLoading: isSeedLoading } = useQuery({
    queryKey: ['verdelis-seed', seedId],
    queryFn: () => fetchVerdelisSeed(seedId!),
    enabled: !!seedId,
    staleTime: 1000 * 60 * 5,
  })

  // Extract error from results if it exists
  const resultError = React.useMemo(() => {
    if (!results || !Array.isArray(results) || results.length === 0) return null

    for (const result of results) {
      if (result && typeof result === 'object') {
        if (result.output && typeof result.output === 'object') {
          if ('error' in result.output) {
            const errorValue = (result.output as { error?: string }).error
            if (typeof errorValue === 'string') return errorValue
          }
        }
        if ('error' in result) {
          const errorValue = (result as { error?: string }).error
          if (typeof errorValue === 'string') return errorValue
        }
      }
    }
    return null
  }, [results])

  const displayError = error || resultError
  const currentAgentIds = currentSession?.agents?.map(agent => agent._id) || []
  const chatLinkPath = sessionId ? `/sessions/${sessionId}` : undefined
  const isRunning =
    toolStatus === TaskV2Status.Running || toolStatus === TaskV2Status.Pending

  // If no session and no seed, check for error
  if (!sessionId && !seedId) {
    if (displayError) {
      return (
        <div className="mt-2">
          <AlertDestructive title="Tool Call failed">
            <AlertDescription>
              <TextClampMore text={displayError} lines={3} />
            </AlertDescription>
          </AlertDestructive>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-3">
      {/* Child session card */}
      {sessionId && (isSessionLoading || session) && (
        <div className="relative">
          {isSessionLoading ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading session...</span>
              </div>
            </div>
          ) : session ? (
            <>
              <InlineSessionCard
                session={session}
                hideAgentIds={currentAgentIds}
                linkPath={chatLinkPath}
                onClick={onSessionClick}
              />

              {/* Running indicator and cancel button */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {isRunning && (
                  <span className="text-blue-500 h-4 w-4 loading loading-ring pointer-events-none" />
                )}
                {isRunning && onCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      e.preventDefault()
                      onCancel()
                    }}
                    className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive pointer-events-auto"
                  >
                    <XIcon className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Seed preview - shown when seed is available */}
      {seedId && (
        <div>
          {isSeedLoading ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading story seed...</span>
              </div>
            </div>
          ) : seed ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Header with icon and title */}
              <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">
                      {seed.title || 'Untitled Seed'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Logline */}
              {seed.logline && (
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {seed.logline}
                  </p>
                </div>
              )}

              {/* Image thumbnails with lightbox */}
              {seed.images && seed.images.length > 0 && (
                <div className="p-3">
                  <LightboxGallery withDownloadButton>
                    <div
                      className={`grid gap-2 ${
                        seed.images.length === 1
                          ? 'grid-cols-1'
                          : seed.images.length === 2
                          ? 'grid-cols-2'
                          : seed.images.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-4'
                      }`}
                    >
                      {seed.images
                        .slice(0, 4)
                        .map((imageUrl: string, imgIndex: number) => (
                          <div
                            key={imgIndex}
                            className="relative aspect-video rounded-md overflow-hidden bg-muted cursor-pointer"
                          >
                            <LightboxGalleryItem
                              item={{
                                url: imageUrl,
                                thumbnail: imageUrl,
                                width: 1024,
                                height: 576,
                              }}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                    </div>
                  </LightboxGallery>
                  {seed.images.length > 4 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      +{seed.images.length - 4} more images
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Display existing reactions */}
      {reactions.length > 0 && (
        <div className="space-y-1">
          {reactions.map((reaction, idx) => (
            <div
              key={idx}
              className="px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground italic"
            >
              {reaction.reaction || '(empty reaction)'}
            </div>
          ))}
        </div>
      )}

      {/* Reaction input - only show when seed exists */}
      {seedId && messageId && toolCallId && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a reaction or note about this seed..."
            value={reactionText}
            onChange={e => setReactionText(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSubmitReaction}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <SendIcon className="h-4 w-4 mr-1" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Display error if present */}
      {displayError && (
        <div className="mt-2">
          <AlertDestructive title="Tool Call failed">
            <AlertDescription>
              <TextClampMore text={displayError} lines={3} />
            </AlertDescription>
          </AlertDestructive>
        </div>
      )}

      {/* Tool hover menu */}
      {toolName && toolArgs && (
        <div className="flex justify-end">
          <ToolHoverMenu toolName={toolName} args={toolArgs} result={results} />
        </div>
      )}
    </div>
  )
}
