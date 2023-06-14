import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import MongooseDelete from 'mongoose-delete'
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

export interface AgentDocument extends AgentSchema, SoftDeleteDocument {}

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
    capabilities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'capabilities',
      },
    ],
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
agent.plugin(MongooseDelete, { deletedAt: true })

export const Agent = model<AgentDocument>('agents', agent)
