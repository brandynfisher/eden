// Agent form constants and guidance text
export const AGENT_FIELD_LIMITS = {
  DESCRIPTION_MAX_CHARS: 500,
  INSTRUCTIONS_MAX_CHARS: 30000,
  NAME_MAX_CHARS: 42,
  GREETING_MAX_CHARS: 140,
} as const

export const AGENT_FIELD_GUIDANCE = {
  DESCRIPTION:
    'Short description of the agent shown on its public profile page.',
  INSTRUCTIONS: `Describe in detail how your agent should behave: its character, behavioral traits, communication style, its knowledge, goals, backstory, rules... 

Typically this is all written in 2nd person:
'You are agent_name, you always talk like this, your goals are to..., you know the following things...'`,
} as const
