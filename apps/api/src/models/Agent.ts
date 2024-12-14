import { BaseUser, BaseUserDocument, BaseUserSchema } from './BaseUser'
import { Schema } from 'mongoose'

export interface AgentSchema extends BaseUserSchema {
  owner: string
  name: string
  description?: string
  instructions: string
  tools?: string[]
  discordId?: string
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
      maxlength: 1000,
    },
    instructions: {
      type: String,
      maxlength: 1000,
      required: true,
    },
    tools: {
      type: [String],
      default: [],
    },
    public: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

AgentSchema.index({ owner: 1 })

export const Agent = BaseUser.discriminator<AgentDocument>('Agent', AgentSchema)
