import { Message } from '@edenlabs/eden-sdk'

// Orchestrator message types that should be treated as moderator messages
const ORCHESTRATOR_MESSAGE_TYPES = [
  // New moderator types
  'moderator_start',
  'moderator_prompt',
  'moderator_vote',
  'moderator_finish',
  // Legacy conductor types
  'conductor_init',
  'conductor_turn',
  'conductor_hint',
  'conductor_finish',
]

/**
 * Check if a message is an orchestrator-type eden message (moderator/conductor)
 */
export function isOrchestratorMessage(message: Message): boolean {
  return (
    message.role === 'eden' &&
    !!message.eden_message_data?.message_type &&
    ORCHESTRATOR_MESSAGE_TYPES.includes(message.eden_message_data.message_type)
  )
}

/**
 * Get the effective sender username for grouping purposes.
 * Orchestrator messages are treated as coming from the 'eden' user.
 */
export function getEffectiveSender(message: Message): string | undefined {
  if (isOrchestratorMessage(message)) {
    return 'eden'
  }
  return message.sender?.username
}

/**
 * Get the effective role for grouping purposes.
 * Orchestrator messages are treated as 'assistant' so they can group with
 * assistant messages from the eden agent.
 */
function getEffectiveRole(message: Message): string {
  if (isOrchestratorMessage(message)) {
    return 'assistant'
  }
  return message.role
}

export function groupConsecutiveMessages(messages: Message[]): Message[][] {
  if (!messages.length) return []
  if (messages.length === 1) return [[messages[0]]]

  const groups: Message[][] = []
  let currentGroup: Message[] = []

  messages.forEach((message, index) => {
    if (index === 0) {
      currentGroup.push(message)
      return
    }

    const previousMessage = messages[index - 1]

    // Group messages by effective sender username AND effective role
    // Orchestrator messages (moderator/conductor) are treated as assistant messages from 'eden'
    const sameRole =
      getEffectiveRole(message) === getEffectiveRole(previousMessage)
    const sameSender =
      getEffectiveSender(message) === getEffectiveSender(previousMessage)

    if (sameRole && sameSender) {
      currentGroup.push(message)
    } else {
      groups.push([...currentGroup])
      currentGroup = [message]
    }

    // If this is the last message, add the current group
    if (index === messages.length - 1) {
      groups.push([...currentGroup])
    }
  })

  return groups
}
