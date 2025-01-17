import { BaseUser, BaseUserDocument, BaseUserSchema } from './BaseUser'
import { ModelV2Document } from './v2/ModelV2'
import { Schema } from 'mongoose'

export interface AgentSchema extends BaseUserSchema {
  owner: string
  name: string
  description?: string
  instructions: string
  tools?: string[]
  discordId?: string
  model?: ModelV2Document
  public?: boolean
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
      maxlength: 20000,
    },
    instructions: {
      type: String,
      maxlength: 20000,
      required: true,
    },
    tools: {
      type: Schema.Types.Mixed,
      default: {},
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
  },
  {
    discriminatorKey: 'type',
    timestamps: true,
  },
)

AgentSchema.index({ owner: 1 })

export const Agent = BaseUser.discriminator<AgentDocument>('agent', AgentSchema)
