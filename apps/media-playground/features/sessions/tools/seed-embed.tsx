'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TaskV2Result, ToolCallReaction } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { ExternalLink, Loader2, SendIcon } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

export type SeedEmbedProps = {
  results: TaskV2Result[]
  messageId?: string
  toolCallId?: string
  existingReactions?: ToolCallReaction[]
}

export const SeedEmbed: React.FC<SeedEmbedProps> = ({
  results,
  messageId,
  toolCallId,
  existingReactions,
}) => {
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
        // Update local reactions state
        const newReaction: ToolCallReaction = {
          user_id: 'current_user', // Will be replaced by actual user from API response
          reaction: reactionText,
          createdAt: new Date(),
        }
        setReactions(prev => {
          // Replace existing reaction from this user or add new one
          const filtered = prev.filter(r => r.user_id !== newReaction.user_id)
          return [...filtered, newReaction]
        })
        setReactionText('')
        toast.success('Reaction submitted')
      }
    } catch (error) {
      toast.error('Failed to submit reaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle case where results might not have the expected structure
  if (!results || !Array.isArray(results)) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">Seed created</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((result, index) => (
        <div key={index} className="space-y-1">
          {result && result.output && Array.isArray(result.output) ? (
            result.output.map((output, outputIndex) => (
              <div
                key={outputIndex}
                className="flex items-center gap-2 px-3 py-2 bg-accent rounded-md border border-secondary"
              >
                <span className="text-sm text-muted-foreground">
                  Seed created on Abraham
                </span>
                {output && typeof output === 'object' && 'url' in output ? (
                  <a
                    href={(output as { url?: string }).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    View Seed
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    (no URL available)
                  </span>
                )}
              </div>
            ))
          ) : result && result.output && typeof result.output === 'string' ? (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Seed created on Abraham
              </span>
              <div className="text-sm mt-1 text-foreground/80">
                {result.output}
              </div>
            </div>
          ) : result &&
            result.output &&
            typeof result.output === 'object' &&
            'url' in result.output ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Seed created on Abraham
              </span>
              <a
                href={(result.output as { url?: string }).url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                View Seed
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Seed created on Abraham
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Display existing reactions */}
      {reactions.length > 0 && (
        <div className="mt-2 space-y-1">
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

      {/* Reaction input */}
      {messageId && toolCallId && (
        <div className="mt-3 space-y-2">
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
    </div>
  )
}
