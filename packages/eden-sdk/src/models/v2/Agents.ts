import { AllowlistItem } from './Deployments'
import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'
import { ModelV2 } from 'src/models/v2'
import { Deployment } from 'src/models/v2/Deployments'
import { CronSchedule, Trigger } from 'src/models/v2/Trigger'
import { WebAPICallOptions, WebAPICallResult } from 'src/types'

export type AgentSuggestion = {
  label: string
  prompt: string
}

export type AgentStats = {
  threadCount: number
  userCount: number
  userMessageCount: number
  assistantMessageCount: number
  toolCallCount: number
  threadCount_7d: number
  userCount_7d: number
  userMessageCount_7d: number
  assistantMessageCount_7d: number
  toolCallCount_7d: number
  lastUpdated: Date
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
  model?: {
    lora: ModelV2
    use_when?: string
  }[]
  discordUsername?: string
  telegramId?: string
  telegramUsername?: string
  createdAt: Date
  updatedAt: Date
  public?: boolean
  likeCount?: number
  isLiked?: boolean
  owner_pays?: boolean
  stats?: AgentStats
  agent_extras?: {
    permissions?: {
      editors?: Creator[]
    }
  }
}

export type AgentClientType =
  | 'discord'
  | 'telegram'
  | 'twitter'
  | 'farcaster'
  | 'web'
  | 'shopify'
export type AgentDeployCommand = 'deploy' | 'stop'
export type AgentDeployCredentials = {
  CLIENT_DISCORD_TOKEN: string
}

// Arguments
export interface AgentGetArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsCreateArguments extends WebAPICallOptions {
  name: string
  key: string
  description?: string
  persona?: string
  isPersonaPublic?: boolean
  greeting?: string
  knowledge?: string
  suggestions?: AgentSuggestion[]
  image: string
  tools?: { [key: string]: boolean }
  discordId?: string
  voice?: string
  models?: Array<{
    lora: string
    use_when?: string
  }>
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
  models?: Array<{
    lora: string
    use_when?: string
  }>
  owner_pays?: boolean
  agent_extras?: {
    permissions?: {
      editors?: string[]
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

interface ShopifyDeploymentConfig extends Record<string, never> {}

interface ShopifyDeploymentSecrets {
  store_name: string
  access_token: string
  location_id: number
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
    shopify?: ShopifyDeploymentConfig
  }
  secrets?: {
    discord?: DiscordDeploymentSecrets
    telegram?: TelegramDeploymentSecrets
    farcaster?: FarcasterDeploymentSecrets
    twitter?: TwitterDeploymentSecrets
    shopify?: ShopifyDeploymentSecrets
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
    shopify?: ShopifyDeploymentConfig
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
 * Trigger
 */
export interface AgentsGetTriggersArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsCreateTriggerArguments extends WebAPICallOptions {
  agentId: string
  instruction: string
  session_type: 'new' | 'another'
  session?: string | null
  schedule: CronSchedule
  posting_instructions?: {
    post_to: 'same' | 'another' | 'discord' | 'telegram' | 'x' | 'farcaster'
    session_id?: string | null
    channel_id?: string | null
    custom_instructions?: string
  }
}

export interface AgentsUpdateTriggerArguments extends WebAPICallOptions {
  agentId: string
  triggerId: string
  instruction?: string
  session_type?: 'new' | 'another'
  session?: string | null
  schedule?: CronSchedule
  status?: 'active' | 'paused' | 'finished'
  posting_instructions?: {
    post_to: 'same' | 'another' | 'discord' | 'telegram' | 'x' | 'farcaster'
    session_id?: string | null
    channel_id?: string | null
    custom_instructions?: string
  }
}

export interface AgentsDeleteTriggerArguments extends WebAPICallOptions {
  agentId: string
  triggerId: string
}

export interface AgentsGetAllTriggersArguments extends WebAPICallOptions {}

export interface AgentsGetAllDeploymentsArguments extends WebAPICallOptions {}

export interface AgentsLikeArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsUnlikeArguments extends WebAPICallOptions {
  agentId: string
}

// Requests
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

export const agentsGetTriggersRequestConfig = (
  args: AgentsGetTriggersArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/agents/${args.agentId}/triggers`,
  }
}

export const agentsCreateTriggerRequestConfig = (
  args: AgentsCreateTriggerArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/agents/${args.agentId}/triggers`,
    data: args,
  }
}

export const agentsUpdateTriggerRequestConfig = (
  args: AgentsUpdateTriggerArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v2/agents/${args.agentId}/triggers/${args.triggerId}`,
    data: args,
  }
}

export const agentsDeleteTriggerRequestConfig = (
  args: AgentsDeleteTriggerArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/agents/${args.agentId}/triggers/${args.triggerId}`,
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

export type AgentsGetTriggersResponse = WebAPICallResult & {
  triggers: Trigger[]
  error?: string
}

export type AgentsCreateTriggerResponse = WebAPICallResult & {
  triggerId: string
  error?: string
}

export type AgentsUpdateTriggerResponse = WebAPICallResult & {
  trigger: Trigger
  error?: string
}

export type AgentsDeleteTriggerResponse = WebAPICallResult & {
  success: boolean
  error?: string
}

export type AgentsGetAllTriggersResponse = WebAPICallResult & {
  triggers: Array<
    Trigger & {
      agent: { _id: string; name: string; username: string; userImage?: string }
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
