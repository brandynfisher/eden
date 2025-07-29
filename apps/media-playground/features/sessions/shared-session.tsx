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
import { useMemo } from 'react'

interface SharedSessionProps {
  shareId: string
}

export const SharedSession = ({ shareId }: SharedSessionProps) => {
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

  if (isLoading) {
    return (
      <div className="flex mx-auto py-16">
        <LoadingIndicator />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex mx-auto py-16 md:w-1/2 w-[calc(100%-2rem)]">
        <AlertDestructive>
          <AlertDescription>
            This shared session could not be found or is no longer available.
          </AlertDescription>
        </AlertDestructive>
      </div>
    )
  }

  if (!sharedSessionData?.share) {
    return (
      <div className="flex mx-auto py-16 md:w-1/2 w-[calc(100%-2rem)]">
        <AlertDestructive>
          <AlertDescription>
            This shared session is not available.
          </AlertDescription>
        </AlertDestructive>
      </div>
    )
  }

  const { share } = sharedSessionData

  return (
    <div className="flex-1 pb-4">
      <div className="p-4 pb-8 max-w-[--aui-thread-max-width] mx-auto w-full">
        {/* Shared Session Header */}
        <div className="mb-6 border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {share.title || 'Shared Conversation'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Shared by {share.owner.username} on{' '}
                {new Date(share.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-muted px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-muted-foreground">
                Shared Session
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
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
        </div>

        {/* Footer Notice */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            This is a shared conversation. You cannot interact with this
            session.
          </p>
        </div>
      </div>
    </div>
  )
}
