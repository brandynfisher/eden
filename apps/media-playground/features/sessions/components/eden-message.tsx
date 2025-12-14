import { Alert, AlertDescription } from '@/components/ui/alert'
import { Message } from '@edenlabs/eden-sdk'
import { AlertTriangle, UserMinus, UserPlus, Users } from 'lucide-react'

interface EdenMessageProps {
  message: Message
}

export const EdenMessage = ({ message }: EdenMessageProps) => {
  const { eden_message_data, content } = message

  // Handle trigger messages with SESSION CONTEXT style
  if (eden_message_data?.message_type === 'trigger' && content) {
    const trimmedContent = content.trim()
    return (
      <div className="pt-3 pb-5 pl-[calc(3rem+0.75rem)]">
        <div className="max-w-[42rem]">
          <div className="text-[0.62rem] font-medium text-blue-600/50 dark:text-blue-400/50 mb-1 px-1">
            TASK
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

  if (!eden_message_data) return null

  const { message_type, agents, error } = eden_message_data

  if (message_type === 'rate_limit') {
    const errorText =
      error || message.content || "You're sending messages too quickly."

    return (
      <div className="flex justify-center py-2">
        <Alert
          variant="destructive"
          className="max-w-[42rem] w-full items-start"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <AlertDescription className="text-sm">{errorText}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isAgentAdd = message_type === 'agent_add'
  const isAgentRemove = message_type === 'agent_remove'

  if (!agents || agents.length === 0) return null

  const agentNames = agents.map(agent => agent.name).join(', ')
  const Icon = isAgentAdd ? UserPlus : isAgentRemove ? UserMinus : Users

  let text = ''
  if (isAgentAdd) {
    text =
      agents.length === 1
        ? `Added agent ${agentNames}`
        : `Added agents ${agentNames}`
  } else if (isAgentRemove) {
    text =
      agents.length === 1
        ? `Removed agent ${agentNames}`
        : `Removed agents ${agentNames}`
  }

  return (
    <div className="flex justify-center py-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
        <Icon className="w-3 h-3" />
        <span>{text}</span>
      </div>
    </div>
  )
}
