'use client'

import { groupConsecutiveMessages } from './utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useSharedSessionQuery } from '@/hooks/query/use-shared-session-query'
import { Message } from '@edenlabs/eden-sdk'
import { useEffect, useMemo, useRef } from 'react'

interface SharedSessionProps {
  shareId: string
}

export const SharedSession = ({ shareId }: SharedSessionProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    data: sharedSessionData,
    isLoading,
    error,
  } = useSharedSessionQuery({
    shareId,
    enabled: !!shareId,
  })

  const messages = useMemo(() => {
    if (!sharedSessionData?.share?.messages) return []
    return sharedSessionData.share.messages
  }, [sharedSessionData])

  const messageGroups = useMemo(
    () => groupConsecutiveMessages(messages),
    [messages],
  )

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingIndicator />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="w-full max-w-md">
          <AlertDestructive>
            <AlertDescription>
              This shared session could not be found or is no longer available.
            </AlertDescription>
          </AlertDestructive>
        </div>
      </div>
    )
  }

  if (!sharedSessionData?.share) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="w-full max-w-md">
          <AlertDestructive>
            <AlertDescription>
              This shared session is not available.
            </AlertDescription>
          </AlertDestructive>
        </div>
      </div>
    )
  }

  const { share } = sharedSessionData

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-3xl mx-auto">
          {/* Session Info */}
          <div className="mb-8 pb-6 border-b border-border">
            <h1 className="text-2xl font-bold mb-2">
              {share.title || 'Shared Conversation'}
            </h1>
            <p className="text-muted-foreground">
              Shared by {share.owner.username} on{' '}
              {new Date(share.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Messages */}
          <div className="space-y-6">
            {messageGroups.map((group, groupIndex) =>
              group.map((message: Message, messageIndex: number) => {
                if (message.role === 'user') {
                  return (
                    <UserMessage
                      key={message._id}
                      message={message}
                      session={share.session}
                    />
                  )
                } else if (message.role === 'assistant') {
                  return (
                    <OtherMessage
                      key={message._id}
                      message={message}
                      session={share.session}
                    />
                  )
                } else if (
                  message.role === 'system' &&
                  message.eden_message_data
                ) {
                  return (
                    <EdenMessage
                      key={message._id}
                      message={message}
                      session={share.session}
                    />
                  )
                }
                return null
              }),
            )}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Notice */}
          <div className="mt-12 mb-8 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground text-center">
              This is a shared conversation. You cannot interact with this
              session.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
