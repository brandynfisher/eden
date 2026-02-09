import {
  DiscordBrandIcon,
  FarcasterBrandIcon,
  GmailBrandIcon,
  GoogleBrandIcon,
  InstagramBrandIcon,
  MoltbookBrandIcon,
  ShopifyBrandIcon,
  TelegramBrandIcon,
  TikTokBrandIcon,
  TwitterBrandIcon,
} from '@/components/icons/brand-icons'
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { DiscordV3DeploymentForm } from '@/features/agent/deployment-sheet/discord-v3-deployment-form'
import { EmailDeploymentForm } from '@/features/agent/deployment-sheet/email-deployment-form'
import { FarcasterDeploymentForm } from '@/features/agent/deployment-sheet/farcaster-deployment-form'
import { GmailDeploymentForm } from '@/features/agent/deployment-sheet/gmail-deployment-form'
import { GoogleCalendarDeploymentForm } from '@/features/agent/deployment-sheet/google-calendar-deployment-form'
import { InstagramDeploymentForm } from '@/features/agent/deployment-sheet/instagram-deployment-form'
import { MoltbookDeploymentForm } from '@/features/agent/deployment-sheet/moltbook-deployment-form'
import { TelegramDeploymentForm } from '@/features/agent/deployment-sheet/telegram-deployment-form'
import { TiktokDeploymentForm } from '@/features/agent/deployment-sheet/tiktok-deployment-form'
import { TwitterDeploymentForm } from '@/features/agent/deployment-sheet/twitter-deployment-form'
import { Deployment } from '@edenlabs/eden-sdk'
import { Mail, Settings, Video, Zap } from 'lucide-react'
import { ComponentType } from 'react'

export type IntegrationCategory = 'social' | 'utilities' | 'other'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = ComponentType<any>

export type IntegrationDefinition = {
  platform: string
  label: string
  description: string
  category: IntegrationCategory
  icon: IconComponent
  allowCreate?: boolean
}

export const INTEGRATION_CATEGORIES: Record<IntegrationCategory, string> = {
  social: 'Social Platforms',
  utilities: 'Utilities',
  other: 'Other',
}

export const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  {
    platform: 'discord_v3',
    label: 'Discord',
    description: 'OAuth-based Discord setup with channel permissions.',
    category: 'social',
    icon: DiscordBrandIcon,
  },
  {
    platform: 'discord',
    label: 'Discord (Bot token)',
    description: 'Legacy bot-token setup with manual channel selection.',
    category: 'social',
    icon: DiscordBrandIcon,
    allowCreate: false,
  },
  {
    platform: 'telegram',
    label: 'Telegram',
    description: 'Bring your agent into Telegram chats and channels.',
    category: 'social',
    icon: TelegramBrandIcon,
  },
  {
    platform: 'twitter',
    label: 'Twitter / X',
    description: 'Connect Twitter to enable posts and replies.',
    category: 'social',
    icon: TwitterBrandIcon,
  },
  {
    platform: 'farcaster',
    label: 'Farcaster',
    description: 'Deploy your agent to the Farcaster network.',
    category: 'social',
    icon: FarcasterBrandIcon,
  },
  {
    platform: 'moltbook',
    label: 'Moltbook',
    description: 'Connect your Moltbook account for social publishing.',
    category: 'social',
    icon: MoltbookBrandIcon,
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    description: 'Publish posts and reels from your agent.',
    category: 'utilities',
    icon: InstagramBrandIcon,
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    description: 'Connect a TikTok account for publishing.',
    category: 'utilities',
    icon: TikTokBrandIcon,
  },
  {
    platform: 'google_calendar',
    label: 'Google Calendar',
    description: 'Schedule and manage calendar events.',
    category: 'utilities',
    icon: GoogleBrandIcon,
  },
  {
    platform: 'shopify',
    label: 'Shopify',
    description: 'Connect your store for commerce workflows.',
    category: 'utilities',
    icon: ShopifyBrandIcon,
  },
  {
    platform: 'printify',
    label: 'Printify',
    description: 'Print-on-demand catalog access.',
    category: 'utilities',
    icon: Settings,
  },
  {
    platform: 'captions',
    label: 'Captions AI',
    description: 'Generate ad videos with Captions.',
    category: 'utilities',
    icon: Video,
  },
  {
    platform: 'email',
    label: 'Email',
    description: 'Set up transactional email with DNS verification.',
    category: 'utilities',
    icon: Mail,
  },
  {
    platform: 'gmail',
    label: 'Gmail',
    description: 'Tune reply behavior for existing Gmail deployments.',
    category: 'utilities',
    icon: GmailBrandIcon,
    allowCreate: false,
  },
]

const definitionMap = new Map(
  INTEGRATION_DEFINITIONS.map(definition => [definition.platform, definition]),
)

export const getIntegrationDefinition = (platform: string) =>
  definitionMap.get(platform)

export const getIntegrationLabel = (platform: string) =>
  getIntegrationDefinition(platform)?.label ?? platform

export const getIntegrationDescription = (platform: string) =>
  getIntegrationDefinition(platform)?.description ?? ''

export const getIntegrationCategory = (platform: string) =>
  getIntegrationDefinition(platform)?.category ?? 'other'

export const getIntegrationIcon = (platform: string) =>
  getIntegrationDefinition(platform)?.icon ?? Zap

// Platforms excluded from the wizard (managed elsewhere or not yet supported)
export const WIZARD_EXCLUDED_PLATFORMS = new Set([
  'shopify',
  'printify',
  'captions',
  'discord',
])

// Form props type for deployment forms
export type IntegrationFormProps = {
  agentId: string
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

// Map of platform to form component
export const INTEGRATION_FORMS: Record<
  string,
  ComponentType<IntegrationFormProps>
> = {
  discord: DiscordDeploymentForm,
  discord_v3: DiscordV3DeploymentForm,
  telegram: TelegramDeploymentForm,
  twitter: TwitterDeploymentForm,
  farcaster: FarcasterDeploymentForm,
  instagram: InstagramDeploymentForm,
  tiktok: TiktokDeploymentForm,
  google_calendar: GoogleCalendarDeploymentForm,
  email: EmailDeploymentForm,
  gmail: GmailDeploymentForm,
  moltbook: MoltbookDeploymentForm,
}
