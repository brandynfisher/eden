'use client'

import { MessageInput } from './components/message-input'
import { groupConsecutiveMessages } from './utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { SessionsSidebar } from '@/features/sessions/components/sessions-sidebar'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { BaseContentMessage } from '@edenlabs/eden-sdk'
import { ChevronRightIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'

const LeftBarSheet: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  const [open, setOpen] = useState(false)
  const handleCloseSheet = () => {
    setOpen(false)
    onItemClick?.()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 md:hidden gap-1"
        >
          <ChevronRightIcon className={'size-4'} />
          View Sessions
          <span className="sr-only">Toggle session list menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col max-h-full pt-10 px-3 bg-[#0e1421] border-r gap-0"
      >
        <SheetTitle className="sr-only">Session List</SheetTitle>
        <SessionsSidebar onItemClick={handleCloseSheet} />
      </SheetContent>
    </Sheet>
  )
}

const Session = () => {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthState()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSessionQuery({
    sessionId: sessionId as string,
    enabled: !!sessionId,
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages, scrollToBottom])

  const isOwnMessage = (senderId?: string) => {
    if (!senderId) return false
    return user?._id === senderId
  }

  const messageGroups = session?.messages
    ? groupConsecutiveMessages(session.messages as BaseContentMessage[])
    : []

  return (
    <div className="flex flex-col fixed inset-x-0 bottom-0 top-16">
      {/* MOBILE-ONLY HEADER */}
      <div className="bg-[#0e1421] border-b px-2 py-2 md:hidden flex items-center justify-between">
        <LeftBarSheet onItemClick={() => {}} />
      </div>

      {/* RESIZABLE LAYOUT FOR DESKTOP / MAIN CONTENT AREA */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 !overflow-y-hidden"
        autoSaveId="resizable-session-layout"
      >
        {/* DESKTOP-ONLY RESIZABLE SIDEBAR */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          collapsible
          collapsedSize={0}
          onCollapse={() => setIsSidebarCollapsed(true)}
          onExpand={() => setIsSidebarCollapsed(false)}
          className={cn(
            'hidden md:flex md:flex-col bg-[#0e1421] border-r transition-all duration-300 ease-in-out',
            'max-w-[320px]',
            isSidebarCollapsed && 'p-0 border-none',
          )}
        >
          {/* Render content only if not collapsed */}
          {!isSidebarCollapsed && <SessionsSidebar />}
        </ResizablePanel>

        {/* Separator Handle - visible only on desktop */}
        <ResizableHandle
          withHandle
          className="hidden md:flex w-2 bg-transparent [&>div]:border-l [&>div]:border-border [&>div]:hover:border-primary [&>div]:transition-colors relative"
        />

        {/* MAIN CONTENT PANEL */}
        <ResizablePanel
          defaultSize={80}
          className="flex flex-col bg-aui-background"
        >
          <div className="flex flex-col overflow-y-auto h-full">
            {isSessionLoading ? (
              <div className="flex mx-auto py-16">
                <LoadingIndicator />
              </div>
            ) : sessionError ? (
              <div className="flex mx-auto py-16 md:w-1/2 w-[calc(100%-2rem)]">
                <AlertDestructive>
                  <AlertDescription>
                    We couldn't load this session. Please try again later. If
                    the problem persists, please contact support.
                  </AlertDescription>
                </AlertDestructive>
              </div>
            ) : (
              <div className="mx-auto flex flex-col flex-1 max-w-[--aui-thread-max-width] w-full">
                <div className="flex-1 overflow-y-auto p-4">
                  {messageGroups.map(group => (
                    <div key={group[0].id} className="space-y-2">
                      {isOwnMessage(group[0].sender?._id) ? (
                        <>
                          {group.map(message => (
                            <UserMessage key={message.id} message={message} />
                          ))}
                        </>
                      ) : (
                        <>
                          {group.map((message, index) => (
                            <OtherMessage
                              sessionId={sessionId as string}
                              key={message.id}
                              message={message}
                              showAvatar={index === 0}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <MessageInput sessionId={sessionId as string} />
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default Session
