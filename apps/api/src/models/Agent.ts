import { BaseUser, BaseUserDocument, BaseUserSchema } from './BaseUser'
import { DeploymentDocument } from './Deployment'
import { UserDocument } from './User'
import { ModelV2Document } from './v2/ModelV2'
import { AgentStats, AgentSuggestion } from '@edenlabs/eden-sdk'
import { Schema } from 'mongoose'

export interface AgentSchema extends BaseUserSchema {
  owner: UserDocument
  name: string
  description?: string
  persona?: string
  isPersonaPublic?: boolean
  greeting?: string
  knowledge?: string
  suggestions?: AgentSuggestion[]
  deployments?: DeploymentDocument[]
  tools?: string[]
  discordId?: string
  model?: ModelV2Document
  discordChannelAllowlist?: {
    id: string
    note: string
  }[]
  telegramTopicAllowlist?: {
    id: string
    note: string
  }[]
  public?: boolean
  stats?: AgentStats
}

export interface AgentDocument extends AgentSchema, BaseUserDocument {}

const AgentSchema = new Schema<AgentDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 80,
    },
    description: {
      type: String,
      maxlength: 5000,
      default: '',
    },
    greeting: {
      type: String,
      maxlength: 140,
    },
    persona: {
      type: String,
      maxlength: 30000,
    },
    isPersonaPublic: {
      type: Boolean,
      default: false,
    },
    knowledge: {
      type: String,
      maxlength: 100000,
      required: false,
    },
    suggestions: [
      {
        type: Schema.Types.Mixed,
        default: [],
      },
    ],
    deployments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'deployments',
        default: [],
      },
    ],
    discordChannelAllowlist: [
      {
        type: Schema.Types.Mixed,
        default: [],
      },
    ],
    telegramTopicAllowlist: [
      {
        type: Schema.Types.Mixed,
        default: [],
      },
    ],
    tools: {
      type: Schema.Types.Mixed,
      default: {},
      required: false,
    },
    model: {
      type: Schema.Types.ObjectId,
      ref: 'models3',
      required: false,
    },
    public: {
      type: Boolean,
      default: false,
    },
    stats: {
      type: {
        threadCount: Number,
        userCount: Number,
        userMessageCount: Number,
        assistantMessageCount: Number,
        toolCallCount: Number,
        userCount_7d: Number,
        userMessageCount_7d: Number,
        assistantMessageCount_7d: Number,
        toolCallCount_7d: Number,
        lastUpdated: Date,
      },
      default: {
        threadCount: 0,
        userCount: 0,
        userMessageCount: 0,
        assistantMessageCount: 0,
        toolCallCount: 0,
        userCount_7d: 0,
        userMessageCount_7d: 0,
        assistantMessageCount_7d: 0,
        toolCallCount_7d: 0,
        lastUpdated: new Date(),
      },
    },
  },
  {
    discriminatorKey: 'type',
    timestamps: true,
  },
)

AgentSchema.index({ owner: 1 })
AgentSchema.index({
  'stats.threadCount': -1,
  'stats.userCount': -1,
  'stats.userMessageCount': -1,
  'stats.assistantMessageCount': -1,
  'stats.toolCallCount': -1,
})

AgentSchema.index({
  'stats.threadCount_7d': -1,
  'stats.userCount_7d': -1,
  'stats.userMessageCount_7d': -1,
  'stats.assistantMessageCount_7d': -1,
  'stats.toolCallCount_7d': -1,
})

export const Agent = BaseUser.discriminator<AgentDocument>('agent', AgentSchema)
