import { Agent } from 'src/models/v2'

// Base Types
export type ClientType =
  | 'discord'
  | 'telegram'
  | 'farcaster'
  | 'twitter'
  | 'shopify'
  | 'printify'
  | 'captions'

export type AllowlistItem = {
  id: string
  note?: string
}

// Discord Types
export type DiscordAllowlistItem = AllowlistItem

export type DeploymentSettingsDiscord = {
  oauth_client_id?: string
  oauth_url?: string
  channel_allowlist?: DiscordAllowlistItem[]
  read_access_channels?: DiscordAllowlistItem[]
}

export type DeploymentSecretsDiscord = {
  token: string
  application_id?: string
}

// Telegram Types
export type TelegramAllowlistItem = AllowlistItem

export type DeploymentSettingsTelegram = {
  topic_allowlist?: TelegramAllowlistItem[]
}

export type DeploymentSecretsTelegram = {
  token: string
  webhook_secret?: string
}

// Farcaster Types
export type DeploymentSettingsFarcaster = {
  webhook_id?: string
  auto_reply?: boolean
}

export type DeploymentSecretsFarcaster = {
  mnemonic: string
  neynar_webhook_secret?: string
}

// Twitter Types
export type DeploymentSettingsTwitter = {
  username?: string
}

export type DeploymentSecretsTwitter = {
  user_id: string
  bearer_token: string
  consumer_key: string
  consumer_secret: string
  access_token: string
  access_token_secret: string
}

// Shopify Types
export type DeploymentSettingsShopify = Record<string, never>

export type DeploymentSecretsShopify = {
  store_name: string
  access_token: string
  location_id: string
}

// Printify Types
export type DeploymentSettingsPrintify = Record<string, never>

export type DeploymentSecretsPrintify = {
  api_key: string
  shop_id: string
}

// Captions Types
export type DeploymentSettingsCaptions = Record<string, never>

export type DeploymentSecretsCaptions = {
  api_key: string
}

// Combined Types
export type DeploymentSecrets = {
  discord?: DeploymentSecretsDiscord
  telegram?: DeploymentSecretsTelegram
  farcaster?: DeploymentSecretsFarcaster
  twitter?: DeploymentSecretsTwitter
  shopify?: DeploymentSecretsShopify
  printify?: DeploymentSecretsPrintify
  captions?: DeploymentSecretsCaptions
}

export type DeploymentConfig = {
  discord?: DeploymentSettingsDiscord
  telegram?: DeploymentSettingsTelegram
  farcaster?: DeploymentSettingsFarcaster
  twitter?: DeploymentSettingsTwitter
  shopify?: DeploymentSettingsShopify
  printify?: DeploymentSettingsPrintify
  captions?: DeploymentSettingsCaptions
}

export type Deployment = {
  _id: string
  agent: Agent | string
  user: string
  platform: ClientType
  secrets?: DeploymentSecrets
  config?: DeploymentConfig
  valid?: boolean
  createdAt: Date
  updatedAt: Date
}
