import { Creator } from 'src/models/Creators'
import { Agent, SessionV2, ToolCall } from 'src/models/v2'

export type MessageReaction = {
  [key: string]: (string | number | boolean | Date | null)[]
}

type ChannelType = 'eden' | 'discord' | 'telegram' | 'twitter' | 'farcaster'

export type Channel = {
  type: ChannelType
  key: string
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'eden'

export type EdenMessageType =
  | 'agent_add'
  | 'agent_remove'
  | 'rate_limit'
  | 'trigger'
  // Legacy conductor types (deprecated, use moderator_* instead)
  | 'conductor_init'
  | 'conductor_turn'
  | 'conductor_hint'
  | 'conductor_finish'
  // New moderator types
  | 'moderator_start'
  | 'moderator_prompt'
  | 'moderator_vote'
  | 'moderator_finish'
  | 'private_message'

export type EdenMessageAgentData = {
  id: string
  name: string
  username?: string
  avatar?: string
}

export type EdenMessageData = {
  message_type: EdenMessageType
  agents?: EdenMessageAgentData[]
  /** Sender agent for private messages */
  sender?: EdenMessageAgentData
  error?: string
}

export type Thought = {
  type: 'thinking'
  title?: string
  thinking: string
  signature: string
}

export type Message = {
  _id: string
  session: SessionV2[]
  sender: Creator | Agent
  eden_user_id?: string
  triggering_user?: string
  billed_user?: string
  agent_owner?: string
  role: MessageRole
  eden_message_data?: EdenMessageData
  content: string
  name?: string
  tool_call_id?: string
  channel?: Channel
  reply_to?: Message
  reactions?: MessageReaction
  attachments?: string[]
  tool_calls?: ToolCall[]
  thought?: Thought[]
  apiKey?: string
  observability?: {
    provider?: string
    session_id?: string
    session_run_id?: string
    trace_id?: string
    generation_id?: string
    tokens_spent?: number
    prompt_tokens?: number
    completion_tokens?: number
    cached_prompt_tokens?: number
    cached_completion_tokens?: number
    cost_usd?: number
    sentry_trace_id?: string | null
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      cached_prompt_tokens?: number
      cached_completion_tokens?: number
      total_tokens?: number
      cost_usd?: number
    }
  }
  /** Reference to raw LLM call data */
  llm_call?: string
  createdAt: Date
  updatedAt: Date
}
