import { ObjectId, Schema, model } from 'mongoose'

export enum ClientType {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  FARCASTER = 'farcaster',
  TWITTER = 'twitter',
  SHOPIFY = 'shopify',
  PRINTIFY = 'printify',
  CAPTIONS = 'captions',
  TIKTOK = 'tiktok',
  GMAIL = 'gmail',
  EMAIL = 'email',
}

// Allowlist item base interface
export interface AllowlistItem {
  id: string
  note?: string
}

// Discord Types
export interface DiscordAllowlistItem extends AllowlistItem {}

export interface DeploymentSettingsDiscord {
  oauth_client_id?: string
  oauth_url?: string
  channel_allowlist?: DiscordAllowlistItem[]
  read_access_channels?: DiscordAllowlistItem[]
}

export interface DeploymentSecretsDiscord {
  token: string
  application_id?: string
}

// Telegram Types
export interface TelegramAllowlistItem extends AllowlistItem {}

export interface DeploymentSettingsTelegram {
  topic_allowlist?: TelegramAllowlistItem[]
  bot_username?: string
}

export interface DeploymentSecretsTelegram {
  token: string
  webhook_secret?: string
}

// Farcaster Types
export interface DeploymentSettingsFarcaster {
  webhook_id?: string
  enable_cast?: boolean
  instructions?: string
}

export interface DeploymentSecretsFarcaster {
  mnemonic?: string // For backwards compatibility with direct mnemonic auth
  signer_uuid?: string // For Neynar managed signers
  neynar_webhook_secret?: string
}

// Twitter Types
export interface DeploymentSettingsTwitter {
  username?: string
  enable_tweet?: boolean
  instructions?: string
}

export interface DeploymentSecretsTwitter {
  user_id: string
  bearer_token: string
  consumer_key: string
  consumer_secret: string
  access_token: string
  access_token_secret: string
}

// Shopify Types
export interface DeploymentSettingsShopify {}

export interface DeploymentSecretsShopify {
  store_name: string
  access_token: string
  location_id: string
}

// Printify Types
export interface DeploymentSettingsPrintify {}

export interface DeploymentSecretsPrintify {
  api_key: string
  shop_id: string
}

// Captions Types
export interface DeploymentSettingsCaptions {}

export interface DeploymentSecretsCaptions {
  api_key: string
}

// TikTok Types
export interface DeploymentSettingsTiktok {}

export interface DeploymentSecretsTiktok {
  access_token: string
  refresh_token: string
  open_id: string
  expires_at: Date
  username?: string
}

// Email Types
export interface DeploymentSettingsEmail {
  domain_id?: string
  sender_email?: string
  autoreply_enabled?: boolean
  reply_delay_average_minutes?: number
  reply_delay_variance_minutes?: number
}

export interface DeploymentSecretsEmail {
  domain?: string
  provider_domain_id?: string
  inbound_route_id?: string
  inbound_route_expression?: string
  forwarding_address?: string
  webhook_signing_key?: string
}

// Gmail Types
export interface DeploymentSettingsGmail {
  reply_from_address?: string
  reply_display_name?: string
  last_history_id?: string
  watch_expiration?: Date | string
  reply_delay_minimum?: number
  reply_delay_variance?: number
  email_instructions?: string
}

export interface DeploymentSecretsGmail {
  service_account_info: Record<string, any>
  delegated_user: string
  token_scopes?: string[]
  pubsub_subscription?: string
  pubsub_topic?: string
  watch_label_ids?: string[]
  reply_alias?: string
}

// Combined Types
export interface DeploymentSecrets {
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

export interface DeploymentConfig {
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

export interface DeploymentSchema {
  agent: ObjectId
  user: ObjectId
  platform: ClientType
  secrets?: DeploymentSecrets
  config?: DeploymentConfig
  valid?: boolean
  local?: boolean
}

export interface DeploymentDocument extends DeploymentSchema {}

const DeploymentSchema = new Schema<DeploymentDocument>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: Object.values(ClientType),
    },
    secrets: {
      type: Object,
    },
    config: {
      type: Object,
    },
    valid: {
      type: Boolean,
    },
    local: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  },
)

DeploymentSchema.index({ agent: 1, platform: 1 }, { unique: true })

export const Deployment = model<DeploymentDocument>(
  'deployments2',
  DeploymentSchema,
)
