'use client'

import { LLMCallButton } from './llm-call-modal'
import { Message } from '@edenlabs/eden-sdk'
import { useTimeAgo } from 'next-timeago'

interface SystemMessageProps {
  message: Message
}

export const SystemMessage = ({ message }: SystemMessageProps) => {
  const { TimeAgo } = useTimeAgo()

  if (!message.content) return null

  // Check if this is a trigger context message
  const isTriggerContext =
    'trigger_context' in message &&
    (message as Message & { trigger_context: boolean }).trigger_context === true

  // Check if this is a session context message
  const isSessionContext =
    'session_context' in message &&
    (message as Message & { session_context: boolean }).session_context === true

  // Check if this is a cancellation message
  const isCancelled = message.content.trim() === 'Response cancelled by user'

  const label = isCancelled
    ? 'CANCELLED'
    : isTriggerContext
    ? 'TASK CONTEXT'
    : isSessionContext
    ? 'SESSION CONTEXT'
    : 'SYSTEM'
  const trimmedContent = message.content.trim()

  // Render cancelled messages with red styling
  if (isCancelled) {
    return (
      <div className="pt-3 pb-5 pl-[calc(3rem+0.75rem)] group">
        <div className="max-w-[42rem]">
          <div className="text-[0.62rem] font-medium text-red-600/70 dark:text-red-400/70 mb-1 px-1">
            {label}
          </div>
          <div className="bg-red-100/40 dark:bg-red-900/20 border border-red-300/50 dark:border-red-700/40 rounded-lg px-4 py-3">
            <div className="text-base text-red-800/80 dark:text-red-200/70 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Cancelled by user</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-3 pb-5 pl-[calc(3rem+0.75rem)] group">
      <div className="max-w-[42rem]">
        <div className="text-[0.62rem] font-medium text-blue-600/50 dark:text-blue-400/50 mb-1 px-1">
          {label}
        </div>
        <div className="bg-blue-100/40 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-800/30 rounded-lg px-4 py-3">
          <div className="text-base text-blue-900/70 dark:text-blue-100/60">
            <pre className="whitespace-pre-wrap font-sans">
              {trimmedContent}
            </pre>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    </div>
  )
}
