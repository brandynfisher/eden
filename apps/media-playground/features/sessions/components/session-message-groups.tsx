'use client'

import { EdenMessage } from './eden-message'
import { SystemMessage } from './system-message'
import { AssistantMessage } from '@/features/sessions/components/assistant-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import {
  getEffectiveSender,
  isOrchestratorMessage,
} from '@/features/sessions/utils/group-messages'
import { Message, SessionV2 } from '@edenlabs/eden-sdk'

type SessionMessageGroupsProps = {
  groups: Message[][]
  sessionId: string
  session?: SessionV2 | null
  isChatRoute: boolean
  showModeratorMessages: boolean
  isOwnMessage: (senderId?: string) => boolean
  enrichMessageSender: (message: Message) => Message
  onChildSessionClick: (sessionId: string) => void
  onArtifactOpen: (artifactId: string) => void
}

export const SessionMessageGroups = ({
  groups,
  sessionId,
  session,
  isChatRoute,
  showModeratorMessages,
  isOwnMessage,
  enrichMessageSender,
  onChildSessionClick,
  onArtifactOpen,
}: SessionMessageGroupsProps) => {
  return (
    <>
      {groups.map(group => {
        const firstMessage = group[0]
        const isNonOrchestratorEden =
          firstMessage.role === 'eden' && !isOrchestratorMessage(firstMessage)
        const effectiveSender = getEffectiveSender(firstMessage)
        const isModeratorGroup = effectiveSender === 'eden'

        return (
          <div key={firstMessage._id}>
            {isNonOrchestratorEden
              ? group.map(message => (
                  <div
                    key={message._id}
                    data-message-id={message._id}
                    className="transition-colors duration-500"
                  >
                    <EdenMessage
                      message={message}
                      agents={session?.agents}
                      showModeratorMessages={showModeratorMessages}
                    />
                  </div>
                ))
              : firstMessage.role === 'system'
              ? group.map(message => (
                  <div
                    key={message._id}
                    data-message-id={message._id}
                    className="transition-colors duration-500"
                  >
                    <SystemMessage message={message} />
                  </div>
                ))
              : isOwnMessage(firstMessage.sender?._id)
              ? group.map(message => (
                  <div
                    key={message._id}
                    data-message-id={message._id}
                    className="transition-colors duration-500"
                  >
                    <UserMessage
                      message={message}
                      session={session ?? undefined}
                    />
                  </div>
                ))
              : isModeratorGroup
              ? group
                  .filter(message => message.role !== 'tool')
                  .map((message, index) => (
                    <div
                      key={message._id}
                      data-message-id={message._id}
                      className="transition-colors duration-500"
                    >
                      {isOrchestratorMessage(message) ? (
                        <EdenMessage
                          message={message}
                          agents={session?.agents}
                          showModeratorMessages={showModeratorMessages}
                          showAvatar={index === 0}
                        />
                      ) : (
                        <AssistantMessage
                          sessionId={sessionId}
                          message={enrichMessageSender(message)}
                          showAvatar={index === 0}
                          isStreamingTokens={false}
                          isChatRoute={isChatRoute}
                          onSessionClick={onChildSessionClick}
                          onArtifactOpen={onArtifactOpen}
                        />
                      )}
                    </div>
                  ))
              : group
                  .filter(message => message.role !== 'tool')
                  .map((message, index) => (
                    <div
                      key={message._id}
                      data-message-id={message._id}
                      className="transition-colors duration-500"
                    >
                      <AssistantMessage
                        sessionId={sessionId}
                        message={enrichMessageSender(message)}
                        showAvatar={index === 0}
                        isStreamingTokens={false}
                        isChatRoute={isChatRoute}
                        onSessionClick={onChildSessionClick}
                        onArtifactOpen={onArtifactOpen}
                      />
                    </div>
                  ))}
          </div>
        )
      })}
    </>
  )
}
