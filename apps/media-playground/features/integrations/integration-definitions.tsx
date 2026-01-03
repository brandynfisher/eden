import {
  CalendarDays,
  Globe,
  Image,
  Mail,
  MessageCircle,
  Settings,
  ShoppingBag,
  Twitter,
  Video,
  Zap,
} from 'lucide-react'

export type IntegrationCategory = 'social' | 'utilities' | 'other'

export type IntegrationDefinition = {
  platform: string
  label: string
  description: string
  category: IntegrationCategory
  icon: typeof Zap
  allowCreate?: boolean
}

export const INTEGRATION_CATEGORIES: Record<IntegrationCategory, string> = {
  social: 'Social Platforms',
  utilities: 'Utilities',
  other: 'Other',
}

export const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  {
    platform: 'discord',
    label: 'Discord',
    description: 'Deploy your agent to Discord servers.',
    category: 'social',
    icon: MessageCircle,
  },
  {
    platform: 'discord_v3',
    label: 'Discord V3 (Beta)',
    description: 'OAuth-based Discord setup with channel permissions.',
    category: 'social',
    icon: MessageCircle,
  },
  {
    platform: 'telegram',
    label: 'Telegram',
    description: 'Bring your agent into Telegram chats and channels.',
    category: 'social',
    icon: MessageCircle,
  },
  {
    platform: 'twitter',
    label: 'Twitter / X',
    description: 'Connect Twitter to enable posts and replies.',
    category: 'social',
    icon: Twitter,
  },
  {
    platform: 'farcaster',
    label: 'Farcaster',
    description: 'Deploy your agent to the Farcaster network.',
    category: 'social',
    icon: Globe,
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    description: 'Publish posts and reels from your agent.',
    category: 'utilities',
    icon: Image,
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    description: 'Connect a TikTok account for publishing.',
    category: 'utilities',
    icon: Video,
  },
  {
    platform: 'google_calendar',
    label: 'Google Calendar',
    description: 'Schedule and manage calendar events.',
    category: 'utilities',
    icon: CalendarDays,
  },
  {
    platform: 'shopify',
    label: 'Shopify',
    description: 'Connect your store for commerce workflows.',
    category: 'utilities',
    icon: ShoppingBag,
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
    icon: Mail,
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
