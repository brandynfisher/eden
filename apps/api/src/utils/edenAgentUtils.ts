import { Agent } from '../models/Agent'

// Moderator/orchestrator message types that should have the eden agent as sender
export const ORCHESTRATOR_MESSAGE_TYPES = [
  'moderator_start',
  'moderator_prompt',
  'moderator_vote',
  'moderator_finish',
  'conductor_init',
  'conductor_turn',
  'conductor_hint',
  'conductor_finish',
]

// Cache the eden agent to avoid repeated lookups
let cachedEdenAgent: {
  _id: string
  username: string
  userImage: string
  name: string
} | null = null

/**
 * Get the eden agent from cache or database.
 * The eden agent is used as the sender for moderator/orchestrator messages.
 */
export const getEdenAgent = async () => {
  if (cachedEdenAgent) {
    return cachedEdenAgent
  }

  const edenAgent = await Agent.findOne({ username: 'eden' })
    .select('_id username userImage name')
    .lean()

  if (edenAgent) {
    cachedEdenAgent = {
      _id: edenAgent._id.toString(),
      username: edenAgent.username,
      userImage: edenAgent.userImage || '',
      name: edenAgent.name || 'Moderator',
    }
  }

  return cachedEdenAgent
}

/**
 * Check if a message is an orchestrator-type eden message (moderator/conductor)
 * that should have the eden agent as its sender.
 */
export const isOrchestratorMessage = (message: any): boolean => {
  return (
    message.role === 'eden' &&
    message.eden_message_data?.message_type &&
    ORCHESTRATOR_MESSAGE_TYPES.includes(message.eden_message_data.message_type)
  )
}

/**
 * Ensure the sender is properly populated for eden role messages.
 * If the sender is missing or incomplete (no userImage), use the eden agent data.
 */
export const ensureSenderPopulated = async (message: any) => {
  // Only process eden role messages that should have the eden agent as sender
  if (!isOrchestratorMessage(message)) {
    return
  }

  // Check if sender is missing or incomplete (no userImage)
  const senderMissing = !message.sender
  const senderIncomplete = message.sender && !message.sender.userImage

  if (senderMissing || senderIncomplete) {
    const edenAgent = await getEdenAgent()
    if (edenAgent) {
      message.sender = edenAgent
    }
  }
}

/**
 * Process an array of messages to ensure eden agent senders are properly populated.
 * This should be called after populating messages from the database.
 */
export const ensureMessagesSenderPopulated = async (messages: any[]) => {
  // First check if any messages need the eden agent
  const needsEdenAgent = messages.some(
    msg => isOrchestratorMessage(msg) && (!msg.sender || !msg.sender.userImage),
  )

  // Only fetch eden agent if needed
  if (needsEdenAgent) {
    const edenAgent = await getEdenAgent()
    if (edenAgent) {
      for (const message of messages) {
        if (isOrchestratorMessage(message)) {
          const senderMissing = !message.sender
          const senderIncomplete = message.sender && !message.sender.userImage
          if (senderMissing || senderIncomplete) {
            message.sender = edenAgent
          }
        }
      }
    }
  }
}
