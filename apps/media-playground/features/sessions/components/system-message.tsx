import { Message } from '@edenlabs/eden-sdk'

interface SystemMessageProps {
  message: Message
}

export const SystemMessage = ({ message }: SystemMessageProps) => {
  if (!message.content) return null

  // Check if this is a trigger context message
  const isTriggerContext =
    'trigger_context' in message &&
    (message as Message & { trigger_context: boolean }).trigger_context === true

  // Check if this is a session context message
  const isSessionContext =
    'session_context' in message &&
    (message as Message & { session_context: boolean }).session_context === true

  const label = isTriggerContext
    ? 'TASK CONTEXT'
    : isSessionContext
    ? 'SESSION CONTEXT'
    : 'SYSTEM'
  const trimmedContent = message.content.trim()

  return (
    <div className="pt-3 pb-5 pl-[calc(3rem+0.75rem)]">
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
      </div>
    </div>
  )
}
