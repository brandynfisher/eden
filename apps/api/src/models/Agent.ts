import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CapabilityDocument } from './Capability'
import { UserDocument } from './Creator'

export interface AgentSchema {
  user: UserDocument
  name: string
  capabilities: CapabilityDocument[]
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
      type: [Schema.Types.ObjectId],
      ref: 'capabilities',
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
