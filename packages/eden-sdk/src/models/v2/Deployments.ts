import { Agent } from 'src/models/v2'

// Types
export type Platform = 'discord' | 'telegram' | 'farcaster'

export type Deployment = {
  _id: string
  agent: Agent
  platform: Platform
  createdAt: Date
  updatedAt: Date
}
