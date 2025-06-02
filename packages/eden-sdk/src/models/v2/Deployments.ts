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
      read_access_channels: AllowlistItem[]
      oauth_client_id?: string
      oauth_url?: string
    }
    telegram: {
      topic_allowlist: AllowlistItem[]
    }
    farcaster: {
      webhook_id?: string
      auto_reply?: boolean
    }
  }
  valid?: boolean
  createdAt: Date
  updatedAt: Date
}
