import { BaseUser, BaseUserDocument, BaseUserSchema } from './BaseUser'
import { DeploymentDocument } from './Deployment'
import { UserDocument } from './User'
import { ModelV2Document } from './v2/ModelV2'
import { AgentStats, AgentSuggestion, LLMSettings } from '@edenlabs/eden-sdk'
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
  tools?: { [key: string]: boolean }
  discordId?: string
  voice?: string
  models?: Array<{
    lora: ModelV2Document
    use_when?: string
  }>
  llm_settings?: LLMSettings
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
  likeCount?: number
  isLiked?: boolean
  owner_pays?: 'off' | 'deployments' | 'full' | boolean // boolean for backward compatibility
  // Permissions are now stored in AgentPermission collection
  agent_extras?: {
    permissions?: {
      editors?: UserDocument[]
      owners?: UserDocument[]
    }
  }
  user_memory_enabled?: boolean
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
    models: {
      type: [
        {
          lora: {
            type: Schema.Types.ObjectId,
            ref: 'models3',
            required: true,
          },
          use_when: {
            type: String,
            required: false,
            maxlength: 500,
          },
        },
      ],
      default: [],
    },
    voice: {
      type: String,
      required: false,
    },
    public: {
      type: Boolean,
      default: true,
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
    likeCount: {
      type: Number,
      default: 0,
    },
    isLiked: {
      type: Boolean,
    },
    owner_pays: {
      type: Schema.Types.Mixed,
      enum: ['off', 'deployments', 'full', true, false], // support boolean for backward compatibility
      default: 'off',
    },
    user_memory_enabled: {
      type: Boolean,
      default: false,
    },
    llm_settings: {
      model_profile: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      thinking_policy: {
        type: String,
        enum: ['auto', 'off', 'always'],
        default: 'auto',
      },
      thinking_effort_cap: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      thinking_effort_instructions: {
        type: String,
        maxlength: 1000,
        default: '',
      },
    },
    // Permissions are now stored in AgentPermission collection
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

// Add index for likeCount-based sorting
AgentSchema.index({
  public: 1,
  deleted: 1,
  likeCount: -1,
  _id: -1,
})

export const Agent = BaseUser.discriminator<AgentDocument>('agent', AgentSchema)
