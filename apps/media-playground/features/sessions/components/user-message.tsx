'use client'

import { MessageAttachment } from './message-attachment'
import { LightboxGallery } from '@/components/media/lightbox'
import { cn } from '@/lib/utils'
import { Message, SessionV2 } from '@edenlabs/eden-sdk'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export const UserMessage = ({
  message,
  session,
}: {
  message: Message
  session?: SessionV2
}) => {
  const pathname = usePathname()
  const isChatRoute = pathname?.startsWith('/chat')
  const [expanded, setExpanded] = useState(false)

  const hasAttachments = message.attachments && message.attachments.length > 0
  const hasContent = message.content && message.content.trim().length > 0

  if (!hasContent && !hasAttachments) return null

  // Check if this is a multi-agent session and if the message has no mentions
  const isMultiAgentSession = session?.agents && session.agents.length > 1
  const hasMentions = message.content && /@\S+/.test(message.content)
  const shouldShowTip = isMultiAgentSession && !hasMentions
  const trimmedContent = message.content?.trim() ?? ''
  const contentLen = trimmedContent.length
  const isHuge = contentLen > 40000 // character threshold
  const previewLimit = 8000 // render a safe preview chunk
  const preview = isHuge
    ? trimmedContent.slice(0, previewLimit)
    : trimmedContent

  // Grid layout logic for attachments (rows of up to 5)
  const getGridLayout = (count: number) => {
    if (count === 1) {
      return 'w-full max-w-32'
    }
    if (count === 2) {
      return 'grid grid-cols-2 gap-1 w-full max-w-64'
    }
    if (count === 3) {
      return 'grid grid-cols-3 gap-1 w-full max-w-96'
    }
    if (count === 4) {
      return 'grid grid-cols-4 gap-1 w-full'
    }
    // 5+ items: rows of up to 5
    return 'grid grid-cols-5 gap-1 w-full'
  }

  const attachmentLayout = getGridLayout(message.attachments?.length || 0)

  return (
    <div
      className={
        isChatRoute ? 'pt-2 pb-4 pl-[calc(3rem+0.75rem)]' : 'pt-2 pb-4 sm:pl-0'
      }
    >
      <div className="max-w-[42rem] flex flex-col items-end">
        <div className="flex flex-col items-end gap-2 max-w-[85%]">
          {hasAttachments && (
            <LightboxGallery galleryKey={message._id}>
              <div className={cn('justify-end', attachmentLayout)}>
                {message.attachments?.map((attachment, index) => (
                  <MessageAttachment
                    key={attachment}
                    url={attachment}
                    index={index}
                    className="w-full aspect-square"
                  />
                ))}
              </div>
            </LightboxGallery>
          )}
          {hasContent && (
            <div className="bg-purple-100 dark:bg-[#3b1660] rounded-2xl px-4 py-3 overflow-hidden">
              <div className="text-left">
                {/* Preview */}
                {!expanded && (
                  <div className="relative">
                    <pre
                      className="whitespace-pre-wrap break-words font-sans text-base"
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {preview!}
                    </pre>
                    {isHuge && (
                      <div className="mt-2 flex">
                        <button
                          type="button"
                          className="text-xs underline text-muted-foreground hover:text-foreground"
                          onClick={() => setExpanded(true)}
                        >
                          Show full message ({contentLen.toLocaleString()}{' '}
                          characters)
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Full (own scroll) */}
                {expanded && (
                  <div className="max-h-[60vh] overflow-y-auto rounded-md border p-3">
                    <pre
                      className="whitespace-pre-wrap break-words font-sans text-base"
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {trimmedContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          {shouldShowTip && (
            <div className="text-xs text-muted-foreground mt-1 italic">
              💡 Tip: @mention an agent to have them respond
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
