import { SubscriptionTier } from '@edenlabs/eden-sdk'

// Agent form constants and guidance text
export const AGENT_FIELD_LIMITS = {
  DESCRIPTION_MAX_CHARS: 100,
  NAME_MAX_CHARS: 42,
  GREETING_MAX_CHARS: 140,
} as const

// Persona character limits per subscription tier
export const PERSONA_CHARACTER_LIMITS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.Free]: 50000,
  [SubscriptionTier.Basic]: 100000,
  [SubscriptionTier.Pro]: 200000,
  [SubscriptionTier.Believer]: 300000,
  [SubscriptionTier.Admin]: 400000,
}

export const SUBSCRIPTION_TIER_NAMES: Record<SubscriptionTier, string> = {
  [SubscriptionTier.Free]: 'Free',
  [SubscriptionTier.Basic]: 'Basic',
  [SubscriptionTier.Pro]: 'Pro',
  [SubscriptionTier.Believer]: 'Believer',
  [SubscriptionTier.Admin]: 'Admin',
}

export const getPersonaCharacterLimit = (
  tier: SubscriptionTier | undefined,
): number => {
  return PERSONA_CHARACTER_LIMITS[tier ?? SubscriptionTier.Free]
}

export const formatCharacterCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
  }
  return count.toString()
}

// Get next tier info for upgrade prompt
export const getNextTierInfo = (currentTier: SubscriptionTier) => {
  if (currentTier >= SubscriptionTier.Believer) {
    return null // Already at max tier (excluding Admin)
  }
  const nextTier = (currentTier + 1) as SubscriptionTier
  return {
    name: SUBSCRIPTION_TIER_NAMES[nextTier],
    limit: getPersonaCharacterLimit(nextTier),
  }
}

export const AGENT_FIELD_GUIDANCE = {
  DESCRIPTION:
    'Short description of the agent shown on its public profile page.',
  INSTRUCTIONS: `Describe in detail how your agent should behave: its character, behavioral traits, communication style, its knowledge, goals, backstory, rules... 

Typically this is all written in 2nd person:
'You are agent_name, you always talk like this, your goals are to..., you know the following things...'`,
} as const
