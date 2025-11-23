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
  | 'tiktok'
  | 'gmail'
  | 'email'

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
  bot_username?: string
}

export type DeploymentSecretsTelegram = {
  token: string
  webhook_secret?: string
}

// Farcaster Types
export type DeploymentSettingsFarcaster = {
  webhook_id?: string
  enable_cast?: boolean
  instructions?: string
}

export type DeploymentSecretsFarcaster = {
  mnemonic?: string // For backwards compatibility with direct mnemonic auth
  signer_uuid?: string // For Neynar managed signers
  neynar_webhook_secret?: string
}

// Twitter Types
export type DeploymentSettingsTwitter = {
  username?: string
  enable_tweet?: boolean
  instructions?: string
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

// TikTok Types
export type DeploymentSettingsTiktok = Record<string, never>

export type DeploymentSecretsTiktok = {
  access_token: string
  refresh_token: string
  open_id: string
  expires_at: Date
  username?: string
}

export type DeploymentSettingsEmail = {
  domain_id?: string
  sender_email?: string
  autoreply_enabled?: boolean
  reply_delay_average_minutes?: number
  reply_delay_variance_minutes?: number
}

export type DeploymentSecretsEmail = {
  domain?: string
  provider_domain_id?: string
  inbound_route_id?: string
  inbound_route_expression?: string
  forwarding_address?: string
  webhook_signing_key?: string
}

export type DeploymentSettingsGmail = {
  reply_from_address?: string
  reply_display_name?: string
  last_history_id?: string
  watch_expiration?: Date | string
  reply_delay_minimum?: number
  reply_delay_variance?: number
  email_instructions?: string
}

export type DeploymentSecretsGmail = {
  service_account_info: Record<string, any>
  delegated_user: string
  token_scopes?: string[]
  pubsub_subscription?: string
  pubsub_topic?: string
  watch_label_ids?: string[]
  reply_alias?: string
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
  tiktok?: DeploymentSecretsTiktok
  email?: DeploymentSecretsEmail
  gmail?: DeploymentSecretsGmail
}

export type DeploymentConfig = {
  discord?: DeploymentSettingsDiscord
  telegram?: DeploymentSettingsTelegram
  farcaster?: DeploymentSettingsFarcaster
  twitter?: DeploymentSettingsTwitter
  shopify?: DeploymentSettingsShopify
  printify?: DeploymentSettingsPrintify
  captions?: DeploymentSettingsCaptions
  tiktok?: DeploymentSettingsTiktok
  email?: DeploymentSettingsEmail
  gmail?: DeploymentSettingsGmail
}

export type Deployment = {
  _id: string
  agent: Agent | string
  user: string
  platform: ClientType
  secrets?: DeploymentSecrets
  config?: DeploymentConfig
  valid?: boolean
  local?: boolean
  createdAt: Date
  updatedAt: Date
}
