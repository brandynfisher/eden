import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { AgentDocument } from './Agent'
import { UserDocument } from './Creator'

export enum CapabilityType {
  CHAT = 'chat',
}

export interface CapabilitySchema {
  user: UserDocument
  agent: AgentDocument
  name: string
  type: CapabilityType
  data: any
  createdAt?: Date
  updatedAt?: Date
}

export interface CapabilityDocument extends CapabilitySchema, Document {}

const capability = new Schema<CapabilityDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'agents',
      required: true,
    },
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

capability.pre<CapabilityDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

capability.plugin(paginate)

export const Capability = model<CapabilityDocument>('capabilities', capability)
