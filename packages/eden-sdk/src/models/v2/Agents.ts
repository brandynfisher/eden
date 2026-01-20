import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { AllowlistItem } from './Deployments'
import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'
import { ModelV2 } from 'src/models/v2'
import { Deployment } from 'src/models/v2/Deployments'
import { Trigger } from 'src/models/v2/Trigger'

export type AgentSuggestion = {
  label: string
  prompt: string
}

export type AgentStats = {
  threadCount: number
  userCount: number
  messageCount: number
  toolCallCount: number
  threadCount_7d: number
  userCount_7d: number
  messageCount_7d: number
  toolCallCount_7d: number
  lastUpdated: Date
}
// Model quality levels for agent LLM selection
export type ModelProfile = 'low' | 'medium' | 'high'

// Thinking policy settings for agent behavior
export type ThinkingPolicy = 'auto' | 'off' | 'always'

// Thinking effort cap settings for agent behavior
export type ThinkingEffortCap = 'low' | 'medium' | 'high'

// LLM settings type
export type LLMSettings = {
  model_profile?: ModelProfile
  thinking_policy?: ThinkingPolicy
  thinking_effort_cap?: ThinkingEffortCap
  thinking_effort_instructions?: string
}

// Types
export type Agent = Omit<
  Creator,
  | 'userId'
  | 'subscriptionTier'
  | 'highestMonthlySubscriptionTier'
  | 'email'
  | 'normalizedEmail'
  | 'stripeCustomerId'
> & {
  _id: string
  owner: Creator
  name: string
  username: string
  description: string
  persona?: string
  isPersonaPublic?: boolean
  userImage: string
  greeting?: string
  knowledge?: string
  suggestions?: AgentSuggestion[]
  tools?: { [key: string]: boolean }
  deployments?: Deployment[]
  discordChannelAllowlist?: {
    id: string
    note: string
  }[]
  telegramTopicAllowlist?: {
    id: string
    note: string
  }[]
  discordId?: string
  voice?: string
  website?: string
  social_accounts?: {
    twitter?: string
    farcaster?: string
  }
  model?: {
    lora: ModelV2
    use_when?: string
  }[]
  llm_settings?: LLMSettings
  discordUsername?: string
  telegramId?: string
  telegramUsername?: string
  createdAt: Date
  updatedAt: Date
  public?: boolean
  likeCount?: number
  isLiked?: boolean
  owner_pays?: 'off' | 'deployments' | 'full' | boolean // boolean for backward compatibility
  stats?: AgentStats
  agent_extras?: {
    permissions?: {
      editors?: Creator[]
      owners?: Creator[]
    }
  }
  user_memory_enabled?: boolean
  agent_memory_enabled?: boolean
}

export type AgentClientType =
  | 'discord'
  | 'telegram'
  | 'twitter'
  | 'farcaster'
  | 'web'
  | 'shopify'
  | 'instagram'
  | 'gmail'
  | 'email'
  | 'google_calendar'
export type AgentDeployCommand = 'deploy' | 'stop'
export type AgentDeployCredentials = {
  CLIENT_DISCORD_TOKEN: string
}

// Arguments
export interface AgentsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
  username?: string | string[]
  name?: string
}

export interface AgentGetArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsCreateArguments extends WebAPICallOptions {
  name: string
  key: string
  description?: string
  persona?: string
  public?: boolean
  isPersonaPublic?: boolean
  greeting?: string
  knowledge?: string
  suggestions?: AgentSuggestion[]
  image: string
  tools?: { [key: string]: boolean }
  discordId?: string
  voice?: string
  website?: string
  social_accounts?: {
    twitter?: string
    farcaster?: string
  }
  models?: Array<{
    lora: string
    use_when?: string
  }>
  llm_settings?: LLMSettings
  owner_pays?: 'off' | 'deployments' | 'full' | boolean // boolean for backward compatibility
}

export interface AgentsUpdateArguments extends WebAPICallOptions {
  agentId: string
  name?: string
  key?: string
  description?: string
  persona?: string
  isPersonaPublic?: boolean
  greeting?: string
  knowledge?: string
  suggestions?: AgentSuggestion[]
  image?: string
  tools?: { [key: string]: boolean }
  discordId?: string
  public?: boolean
  voice?: string
  website?: string
  social_accounts?: {
    twitter?: string
    farcaster?: string
  }
  models?: Array<{
    lora: string
    use_when?: string
  }>
  llm_settings?: LLMSettings
  owner_pays?: 'off' | 'deployments' | 'full' | boolean // boolean for backward compatibility
  agent_extras?: {
    permissions?: {
      editors?: Creator[]
      owners?: Creator[]
    }
  }
}

interface DiscordDeploymentConfig {
  channel_allowlist: {
    id: string
    note: string
  }[]
  oauth_client_id?: string
  oauth_url?: string
}

interface TelegramDeploymentConfig {
  topic_allowlist?: AllowlistItem[]
}

interface TwitterDeploymentConfig {
  username?: string
}

interface FarcasterDeploymentConfig {
  auto_reply?: boolean
}

interface DiscordDeploymentSecrets {
  token: string
}

interface TelegramDeploymentSecrets {
  token: string
}

interface FarcasterDeploymentSecrets {
  mnemonic: string
}

interface TwitterDeploymentSecrets {
  user_id: string
  bearer_token: string
  consumer_key: string
  consumer_secret: string
  access_token: string
  access_token_secret: string
}

interface InstagramDeploymentConfig {
  username?: string
  ig_user_id?: string
}

interface InstagramDeploymentSecrets {
  access_token?: string
  refresh_token?: string
  expires_at?: string
  username?: string
}

interface ShopifyDeploymentConfig extends Record<string, never> {}

interface ShopifyDeploymentSecrets {
  store_name: string
  access_token: string
  location_id: string
}

interface PrintifyDeploymentConfig extends Record<string, never> {}

interface PrintifyDeploymentSecrets {
  api_token: string
  shop_id: string
}

interface CaptionsDeploymentConfig extends Record<string, never> {}

interface CaptionsDeploymentSecrets {
  api_key: string
}

interface EmailDeploymentConfig {
  domain_id?: string
  sender_email?: string
  autoreply_enabled?: boolean
  reply_delay_average_minutes?: number
  reply_delay_variance_minutes?: number
}

interface EmailDeploymentSecrets {
  domain?: string
  provider_domain_id?: string
  inbound_route_id?: string
  inbound_route_expression?: string
  forwarding_address?: string
  webhook_signing_key?: string
}

interface GoogleCalendarDeploymentConfig {
  calendar_id: string
  calendar_name?: string
  allow_write?: boolean
  allow_delete?: boolean
  time_zone?: string
}

interface GoogleCalendarDeploymentSecrets {
  access_token: string
  refresh_token: string
  token_uri: string
  client_id: string
  client_secret: string
  scopes: string[]
  expires_at?: string
  google_user_id?: string
  google_email: string
}

export interface AgentsGetDeploymentsArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsDeployArguments extends WebAPICallOptions {
  agentId: string
  platform: AgentClientType
  config?: {
    discord?: DiscordDeploymentConfig
    telegram?: TelegramDeploymentConfig
    farcaster?: FarcasterDeploymentConfig
    twitter?: TwitterDeploymentConfig
    instagram?: InstagramDeploymentConfig
    shopify?: ShopifyDeploymentConfig
    printify?: PrintifyDeploymentConfig
    captions?: CaptionsDeploymentConfig
    email?: EmailDeploymentConfig
    google_calendar?: GoogleCalendarDeploymentConfig
  }
  secrets?: {
    discord?: DiscordDeploymentSecrets
    telegram?: TelegramDeploymentSecrets
    farcaster?: FarcasterDeploymentSecrets
    twitter?: TwitterDeploymentSecrets
    instagram?: InstagramDeploymentSecrets
    shopify?: ShopifyDeploymentSecrets
    printify?: PrintifyDeploymentSecrets
    captions?: CaptionsDeploymentSecrets
    email?: EmailDeploymentSecrets
    google_calendar?: GoogleCalendarDeploymentSecrets
  }
}

export interface AgentsUpdateDeploymentArguments extends WebAPICallOptions {
  agentId: string
  platform: AgentClientType
  config?: {
    discord?: DiscordDeploymentConfig
    telegram?: TelegramDeploymentConfig
    farcaster?: FarcasterDeploymentConfig
    twitter?: TwitterDeploymentConfig
    instagram?: InstagramDeploymentConfig
    shopify?: ShopifyDeploymentConfig
    email?: EmailDeploymentConfig
    google_calendar?: GoogleCalendarDeploymentConfig
  }
  secrets?: {
    discord?: DiscordDeploymentSecrets
    telegram?: TelegramDeploymentSecrets
    farcaster?: FarcasterDeploymentSecrets
    twitter?: TwitterDeploymentSecrets
    instagram?: InstagramDeploymentSecrets
    shopify?: ShopifyDeploymentSecrets
    printify?: PrintifyDeploymentSecrets
    captions?: CaptionsDeploymentSecrets
    email?: EmailDeploymentSecrets
    google_calendar?: GoogleCalendarDeploymentSecrets
  }
}
export interface AgentsStopDeploymentArguments extends WebAPICallOptions {
  agentId: string
  platform: AgentClientType
}

export interface AgentsDeleteDeploymentArguments extends WebAPICallOptions {
  agentId: string
  platform: AgentClientType
}

export interface AgentsDeleteArguments extends WebAPICallOptions {
  agentId: string
}

/***
 * Trigger - now session-based (not agent-based)
 */
export interface AgentsGetAllTriggersArguments extends WebAPICallOptions {}

export interface AgentsGetAllDeploymentsArguments extends WebAPICallOptions {}

export interface AgentsLikeArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsUnlikeArguments extends WebAPICallOptions {
  agentId: string
}

// Requests
export const agentsListRequestConfig = (
  args: AgentsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/agents',
    params,
  }
}

export const agentGetRequestConfig = (
  args: AgentGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/agents/${args.agentId}`,
  }
}

export const agentsCreateRequestConfig = (
  args: AgentsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/agents',
    data: args,
  }
}

export const agentsUpdateRequestConfig = (
  args: AgentsUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v2/agents/${args.agentId}`,
    data: args,
  }
}

export const agentsGetDeploymentsRequestConfig = (
  args: AgentsGetDeploymentsArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/agents/${args.agentId}/deployments`,
  }
}

export const agentsDeployRequestConfig = (
  args: AgentsDeployArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/agents/${args.agentId}/deployments`,
    data: args,
  }
}

export const agentsUpdateDeploymentRequestConfig = (
  args: AgentsUpdateDeploymentArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v2/agents/${args.agentId}/deployments`,
    data: {
      platform: args.platform,
      config: args.config,
      secrets: args.secrets,
    },
  }
}

export const agentsStopDeploymentRequestConfig = (
  args: AgentsStopDeploymentArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/agents/${args.agentId}/deployments/stop`,
    data: args,
  }
}

export const agentsDeleteDeploymentRequestConfig = (
  args: AgentsDeleteDeploymentArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/agents/${args.agentId}/deployments/${args.platform}`,
  }
}

export const agentsDeleteRequestConfig = (
  args: AgentsDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/agents/${args.agentId}`,
  }
}

export const agentsGetAllTriggersRequestConfig = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _args: AgentsGetAllTriggersArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'v2/agents/triggers',
  }
}

export const agentsGetAllDeploymentsRequestConfig = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _args: AgentsGetAllDeploymentsArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'v2/agents/deployments',
  }
}

export const agentsLikeRequestConfig = (
  args: AgentsLikeArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/agents/${args.agentId}/like`,
    data: {},
  }
}

export const agentsUnlikeRequestConfig = (
  args: AgentsUnlikeArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/agents/${args.agentId}/like`,
  }
}

// Responses
export type AgentsListResponse = WebAPICallResult &
  PaginatedResponse<Agent> & {
    error?: string
  }

export type AgentsGetDeploymentsResponse = WebAPICallResult & {
  deployments: Deployment[]
  error?: string
}

export type AgentGetResponse = WebAPICallResult & {
  agent: Agent
  error?: string
}

export type AgentsCreateResponse = WebAPICallResult & {
  agentId: string
  error?: string
}

export type AgentsUpdateResponse = WebAPICallResult & {
  agent: Agent
  error?: string
}

export type AgentsDeployResponse = WebAPICallResult & {
  deployment_id: string
  error?: string
}

export type AgentsUpdateDeploymentResponse = WebAPICallResult & {
  deploymentId: string
  error?: string
}

export type AgentsStopDeploymentResponse = WebAPICallResult & {
  success: boolean
  error?: string
}

export type AgentsDeleteDeploymentResponse = WebAPICallResult & {
  success: boolean
  error?: string
}

export type AgentsDeleteResponse = WebAPICallResult & {
  success: boolean
  error?: string
}

export type AgentsGetAllTriggersResponse = WebAPICallResult & {
  triggers: Array<
    Trigger & {
      session?: { _id: string; name?: string }
    }
  >
  error?: string
}

export type AgentsGetAllDeploymentsResponse = WebAPICallResult & {
  deployments: Array<
    Deployment & {
      agent: { _id: string; name: string; username: string; userImage?: string }
    }
  >
  error?: string
}

export type AgentsLikeResponse = WebAPICallResult & {
  success: boolean
  error?: string
}

export type AgentsUnlikeResponse = WebAPICallResult & {
  success: boolean
  error?: string
}

// Permission types
export enum AgentPermissionLevel {
  Editor = 'editor',
  Owner = 'owner',
}

export interface AgentPermission {
  _id: string
  agent: string
  user: {
    _id: string
    userId?: string
    username: string
    userImage?: string
  }
  level: AgentPermissionLevel
  grantedAt: Date
}

export interface AgentsGetPermissionsArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsUpdatePermissionsArguments extends WebAPICallOptions {
  agentId: string
  permissions: Array<{
    username: string
    level: 'editor' | 'owner'
  }>
}

export interface AgentsGetSharedArguments extends WebAPICallOptions {}

export type AgentsGetPermissionsResponse = WebAPICallResult & {
  permissions: AgentPermission[]
  error?: string
}

export type AgentsUpdatePermissionsResponse = WebAPICallResult & {
  success: boolean
  error?: string
}

export type AgentsGetSharedResponse = WebAPICallResult & {
  sharedAgents: Array<{
    agent: Agent
    permissionLevel: string
    grantedAt: Date
  }>
  error?: string
}

// Request configs for new permission endpoints
export const agentsGetPermissionsRequestConfig = (
  args: AgentsGetPermissionsArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/agents/${args.agentId}/permissions`,
  }
}

export const agentsUpdatePermissionsRequestConfig = (
  args: AgentsUpdatePermissionsArguments,
): AxiosRequestConfig => {
  return {
    method: 'PUT',
    url: `v2/agents/${args.agentId}/permissions`,
    data: {
      permissions: args.permissions,
    },
  }
}

export const agentsGetSharedRequestConfig = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _args: AgentsGetSharedArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'v2/agents/shared',
  }
}

// Discord channel management types
export interface AgentsGetDiscordChannelsArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsRefreshDiscordChannelsArguments
  extends WebAPICallOptions {
  agentId: string
}

export const agentsGetDiscordChannelsRequestConfig = (
  args: AgentsGetDiscordChannelsArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/agents/${args.agentId}/deployments/discord/channels`,
  }
}

export const agentsRefreshDiscordChannelsRequestConfig = (
  args: AgentsRefreshDiscordChannelsArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/agents/${args.agentId}/deployments/discord/refresh`,
    data: {},
    headers: {
      'Content-Type': 'application/json',
    },
  }
}

export interface AgentsSyncDiscordSessionsArguments extends WebAPICallOptions {
  agentId: string
}

export const agentsSyncDiscordSessionsRequestConfig = (
  args: AgentsSyncDiscordSessionsArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/agents/${args.agentId}/deployments/discord/sync`,
    data: {},
    headers: {
      'Content-Type': 'application/json',
    },
  }
}
