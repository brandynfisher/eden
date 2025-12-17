'use client'

import { LLMCallButton } from './llm-call-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Message } from '@edenlabs/eden-sdk'
import { AlertTriangle, UserMinus, UserPlus, Users } from 'lucide-react'
import { useTimeAgo } from 'next-timeago'

interface EdenMessageProps {
  message: Message
}

export const EdenMessage = ({ message }: EdenMessageProps) => {
  const { eden_message_data, content } = message
  const { TimeAgo } = useTimeAgo()

  // Handle messages with blue background styling (trigger and conductor types)
  const blueBackgroundTypes = [
    'trigger',
    'conductor_init',
    'conductor_turn',
    'conductor_hint',
    'conductor_finish',
  ]

  if (
    eden_message_data?.message_type &&
    blueBackgroundTypes.includes(eden_message_data.message_type) &&
    content
  ) {
    const trimmedContent = content.trim()

    // Determine label based on message type
    const labelMap: Record<string, string> = {
      trigger: 'TASK',
      conductor_init: 'CONDUCTOR INIT',
      conductor_turn: 'CONDUCTOR TURN',
      conductor_hint: 'CONDUCTOR HINT',
      conductor_finish: 'CONDUCTOR FINISH',
    }

    const label = labelMap[eden_message_data.message_type] || 'EDEN'

    // Try to parse and pretty-print JSON content
    let displayContent = trimmedContent
    try {
      const parsed = JSON.parse(trimmedContent)
      displayContent = JSON.stringify(parsed, null, 2)
    } catch {
      // Not JSON, use original content
      displayContent = trimmedContent
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
                {displayContent}
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
            {message.llm_call && <LLMCallButton llmCallId={message.llm_call} />}
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
      <div className="flex flex-col items-center py-2 group">
        <Alert
          variant="destructive"
          className="max-w-[42rem] w-full items-start"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <AlertDescription className="text-sm">{errorText}</AlertDescription>
        </Alert>
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          {message.llm_call && <LLMCallButton llmCallId={message.llm_call} />}
        </div>
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
    <div className="flex flex-col items-center py-2 group">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
        <Icon className="w-3 h-3" />
        <span>{text}</span>
      </div>
      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          className="text-xs text-muted-foreground"
          title={new Date(message.createdAt).toLocaleString()}
        >
          <TimeAgo date={new Date(message.createdAt)} />
        </div>
        {message.llm_call && <LLMCallButton llmCallId={message.llm_call} />}
      </div>
    </div>
  )
}
