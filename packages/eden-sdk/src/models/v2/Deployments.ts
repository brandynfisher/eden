import { Agent } from 'src/models/v2'

// Base Types
export type ClientType =
  | 'discord'
  | 'discord_v3'
  | 'telegram'
  | 'farcaster'
  | 'twitter'
  | 'instagram'
  | 'shopify'
  | 'printify'
  | 'captions'
  | 'tiktok'
  | 'gmail'
  | 'email'
  | 'google_calendar'

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
  enable_discord_dm?: boolean
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

// Instagram Types
export type DeploymentSettingsInstagram = {
  username?: string
  ig_user_id?: string
}

export type DeploymentSecretsInstagram = {
  access_token?: string
  refresh_token?: string
  expires_at?: Date | string
  username?: string
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
export interface DeploymentSettingsTiktok {
  username?: string
}

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

// Google Calendar Types
export type DeploymentSettingsGoogleCalendar = {
  calendar_id: string
  calendar_name?: string
  allow_write?: boolean
  allow_delete?: boolean
  time_zone?: string
  google_email?: string
}

export type DeploymentSecretsGoogleCalendar = {
  access_token: string
  refresh_token: string
  token_uri: string
  client_id: string
  client_secret: string
  scopes: string[]
  expires_at?: Date | string
  google_user_id?: string
  google_email: string
}

export type GoogleCalendarInfo = {
  id: string
  name: string
  primary: boolean
  accessRole: string
  backgroundColor?: string
  timeZone?: string
}

// Combined Types
export type DeploymentSecrets = {
  discord?: DeploymentSecretsDiscord
  telegram?: DeploymentSecretsTelegram
  farcaster?: DeploymentSecretsFarcaster
  twitter?: DeploymentSecretsTwitter
  instagram?: DeploymentSecretsInstagram
  shopify?: DeploymentSecretsShopify
  printify?: DeploymentSecretsPrintify
  captions?: DeploymentSecretsCaptions
  tiktok?: DeploymentSecretsTiktok
  email?: DeploymentSecretsEmail
  gmail?: DeploymentSecretsGmail
  google_calendar?: DeploymentSecretsGoogleCalendar
}

export type DeploymentConfig = {
  discord?: DeploymentSettingsDiscord
  telegram?: DeploymentSettingsTelegram
  farcaster?: DeploymentSettingsFarcaster
  twitter?: DeploymentSettingsTwitter
  instagram?: DeploymentSettingsInstagram
  shopify?: DeploymentSettingsShopify
  printify?: DeploymentSettingsPrintify
  captions?: DeploymentSettingsCaptions
  tiktok?: DeploymentSettingsTiktok
  email?: DeploymentSettingsEmail
  gmail?: DeploymentSettingsGmail
  google_calendar?: DeploymentSettingsGoogleCalendar
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

// Discord channel types for channel selector
export type DiscordChannelInfo = {
  id: string
  name: string
  type: number
  type_name: string
  category_id?: string | null
  category_name?: string | null
  position?: number
}

export type DiscordGuildInfo = {
  id: string
  name: string
  icon?: string | null
  member_count?: number | null
  channels: DiscordChannelInfo[]
}

export type GetDiscordChannelsResponse = {
  guilds: DiscordGuildInfo[]
  last_refreshed_at?: string | null
}

export type RefreshDiscordChannelsResponse = {
  success: boolean
  guilds_count: number
  channels_count: number
  guilds: Array<{ id: string; name: string; channel_count: number }>
}

export type SyncDiscordSessionsResponse = {
  success: boolean
  sessions_count: number
}
