import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'

export enum CapabilityType {
  CHAT = 'chat',
}

export interface CapabilitySchema {
  name: string
  type: CapabilityType
  data: any
}

export interface CapabilityDocument extends CapabilitySchema, Document {}

const capability = new Schema<CapabilityDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(CapabilityType),
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export interface AgentSchema {
  user: UserDocument
  name: string
  capabilities: CapabilitySchema[]
  createdAt?: Date
  updatedAt?: Date
}

export interface AgentDocument extends AgentSchema, Document {}

const agent = new Schema<AgentDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    capabilities: {
      type: [capability],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

agent.pre<AgentDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

agent.plugin(paginate)

export const Agent = model<AgentDocument>('agent', agent)
