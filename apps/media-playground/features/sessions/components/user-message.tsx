import { MessageAttachment } from './message-attachment'
import { LightboxGallery } from '@/components/media/lightbox'
import { MarkdownText } from '@/features/sessions/components/markdown-text'
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
    <div className="flex justify-end py-2">
      <div className="flex flex-col items-end gap-2">
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
          <div className="aui-user-message-content">
            <div className="overflow-x-auto">
              {/* Preview */}
              {!expanded && (
                <div className="overflow-x-auto relative">
                  <MarkdownText>{preview!}</MarkdownText>
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
                  <MarkdownText>{message.content!}</MarkdownText>
                </div>
              )}
            </div>
          </div>
        )}
        {shouldShowTip && (
          <div className="text-xs text-muted-foreground mt-1 max-w-xs text-right italic">
            💡 Tip: @mention an agent to have them respond
          </div>
        )}
      </div>
    </div>
  )
}
