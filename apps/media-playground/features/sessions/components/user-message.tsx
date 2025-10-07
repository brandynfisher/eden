import { MessageAttachment } from './message-attachment'
import { LightboxGallery } from '@/components/media/lightbox'
import { Message, SessionV2 } from '@edenlabs/eden-sdk'
import { useState } from 'react'

export const UserMessage = ({
  message,
  session,
}: {
  message: Message
  session?: SessionV2
}) => {
  const [expanded, setExpanded] = useState(false)

  const hasAttachments = message.attachments && message.attachments.length > 0
  const hasContent = message.content && message.content.trim().length > 0

  if (!hasContent && !hasAttachments) return null

  // Check if this is a multi-agent session and if the message has no mentions
  const isMultiAgentSession = session?.agents && session.agents.length > 1
  const hasMentions = message.content && /@\S+/.test(message.content)
  const shouldShowTip = isMultiAgentSession && !hasMentions
  const contentLen = message.content?.length ?? 0
  const isHuge = contentLen > 40000 // character threshold
  const previewLimit = 8000 // render a safe preview chunk
  const preview = isHuge
    ? message.content!.slice(0, previewLimit)
    : message.content

  return (
    <div className="pt-2 pb-4 pl-[calc(3rem+0.75rem)]">
      <div className="max-w-[42rem] flex flex-col items-end">
        <div className="flex flex-col items-end gap-2 max-w-[85%]">
          {hasAttachments && (
            <LightboxGallery galleryKey={message._id}>
              <div className="flex flex-wrap gap-2 justify-end">
                {message.attachments?.map((attachment, index) => (
                  <MessageAttachment
                    key={attachment}
                    url={attachment}
                    index={index}
                  />
                ))}
              </div>
            </LightboxGallery>
          )}
          {hasContent && (
            <div className="bg-purple-100 dark:bg-[#3b1660] rounded-2xl px-4 py-3">
              <div className="overflow-x-auto text-left">
                {/* Preview */}
                {!expanded && (
                  <div className="overflow-x-auto relative">
                    <pre className="whitespace-pre-wrap font-sans text-base">
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
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-md border p-3">
                    <pre className="whitespace-pre-wrap font-sans text-base">
                      {message.content!}
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
