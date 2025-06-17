import { Message } from '@edenlabs/eden-sdk'
import { UserMinus, UserPlus, Users } from 'lucide-react'

interface EdenMessageProps {
  message: Message
}

export const EdenMessage = ({ message }: EdenMessageProps) => {
  if (!message.eden_message_data) return null

  const { message_type, agents } = message.eden_message_data

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
