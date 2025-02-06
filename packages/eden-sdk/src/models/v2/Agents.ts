import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'
import { ModelV2 } from 'src/models/v2'
import { Deployment } from 'src/models/v2/Deployments'
import { WebAPICallOptions, WebAPICallResult } from 'src/types'

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
  userImage: string
  suggestions?: { text: string; prompt: string }[]
  instructions: string
  tools?: { [key: string]: string[] }
  deployments?: Deployment[]
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
export interface AgentDeployArguments extends WebAPICallResult {
  agent_key: Agent['username']
  platform: AgentClientType
  command: AgentDeployCommand
  credentials: AgentDeployCredentials
}

export interface AgentGetArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsCreateArguments extends WebAPICallOptions {
  name: string
  key: string
  description?: string
  suggestions?: { text: string; prompt: string }[]
  image: string
  instructions?: string
  tools?: { [key: string]: string[] }
  discordId?: string
  modelId?: string
}

export interface AgentsUpdateArguments extends WebAPICallOptions {
  agentId: string
  name?: string
  key?: string
  description?: string
  suggestions?: { text: string; prompt: string }[]
  image?: string
  instructions?: string
  tools?: { [key: string]: string[] }
  discordId?: string
  public?: boolean
  modelId?: string
}

interface DiscordDeploymentConfig {
  enabled: boolean
  token: string
  allowedChannels: {
    id: string
    note: string
  }[]
}

interface TelegramDeploymentConfig {
  enabled: boolean
  token: string
  allowedTopics: {
    id: string
    note: string
  }[]
}

interface FarcasterDeploymentConfig {
  enabled: boolean
  mnemonic: string
  neynarWebhookSecret: string
}

export interface AgentsConfigureDeploymentsArguments extends WebAPICallOptions {
  agentId: string
  discord?: DiscordDeploymentConfig
  telegram?: TelegramDeploymentConfig
  farcaster?: FarcasterDeploymentConfig
}

export interface AgentsDeployArguments extends WebAPICallOptions {
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

export const agentsConfigureDeploymentsRequestConfig = (
  args: AgentsConfigureDeploymentsArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/agents/${args.agentId}/deployments/configure`,
    data: args,
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
export const agentsDeleteRequestConfig = (
  args: AgentsDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/agents/${args.agentId}`,
  }
}

// Responses
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

export type AgentsConfigureDeploymentsResponse = WebAPICallResult & {
  agentId: string
  error?: string
}

export type AgentsDeployResponse = WebAPICallResult & {
  agentId: string
  error?: string
}

export type AgentsDeleteResponse = WebAPICallResult & {
  success: boolean
  error?: string
}
