import { Agent } from 'src/models/v2'

// Types
export type Platform =
  | 'discord'
  | 'telegram'
  | 'farcaster'
  | 'twitter'
  | 'discord_modal'
  | 'telegram_modal'

export type AllowlistItem = {
  id: string
  note?: string
}

export type Deployment = {
  _id: string
  agent: Agent
  platform: Platform
  config: {
    discord: {
      channel_allowlist: AllowlistItem[]
    }
    telegram: {
      topic_allowlist: AllowlistItem[]
    }
  }
  createdAt: Date
  updatedAt: Date
}
