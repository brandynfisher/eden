import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'
import { ModelV2 } from 'src/models/v2'
import { Deployment } from 'src/models/v2/Deployments'
import { WebAPICallOptions, WebAPICallResult } from 'src/types'

export type AgentSuggestion = {
  text: string
  prompt: string
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
  userImage: string
  greeting?: string
  suggestions?: AgentSuggestion[]
  tools?: { [key: string]: string[] }
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
  model?: ModelV2
  discordUsername?: string
  telegramId?: string
  telegramUsername?: string
  createdAt: Date
  updatedAt: Date
  public?: boolean
}

export type AgentClientType = 'discord' | 'telegram' | 'twitter' | 'farcaster'
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
  greeting?: string
  suggestions?: AgentSuggestion[]
  image: string
  tools?: { [key: string]: string[] }
  discordId?: string
  modelId?: string
}

export interface AgentsUpdateArguments extends WebAPICallOptions {
  agentId: string
  name?: string
  key?: string
  description?: string
  persona?: string
  greeting?: string
  suggestions?: AgentSuggestion[]
  image?: string
  tools?: { [key: string]: string[] }
  discordId?: string
  public?: boolean
  modelId?: string
}

interface DiscordDeploymentConfig {
  allowed_channels: {
    id: string
    note: string
  }[]
}

interface TelegramDeploymentConfig {
  allowed_topics: {
    id: string
    note: string
  }[]
}

interface DiscordDeploymentSecrets {
  token: string
}

interface TelegramDeploymentSecrets {
  token: string
}

interface FarcasterDeploymentSecrets {
  mnemonic: string
  neynarWebhookSecret: string
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
  }
  secrets?: {
    discord?: DiscordDeploymentSecrets
    telegram?: TelegramDeploymentSecrets
    farcaster?: FarcasterDeploymentSecrets
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

export const agentsStopDeploymentRequestConfig = (
  args: AgentsStopDeploymentArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/agents/${args.agentId}/deployments/stop`,
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

// Responses
export type AgentsGetDeploymentsResponse = WebAPICallResult & {
  deployments: {
    discord: {
      deployment: Deployment
      allowedChannels: Agent['discordChannelAllowlist']
    }
    telegram: {
      deployment: Deployment
      allowedTopics: Agent['telegramTopicAllowlist']
    }
    farcaster: {
      deployment: Deployment
    }
  }
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
