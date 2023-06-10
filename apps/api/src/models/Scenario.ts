import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'

export enum ScenarioType {
  CHATROOM = 'chatroom',
}

export interface ScenarioSchema {
  user: UserDocument
  name: string
  description: string
  type: ScenarioType
  data: any
  createdAt?: Date
  updatedAt?: Date
}

export interface ScenarioDocument extends ScenarioSchema, Document {}

const scenario = new Schema<ScenarioDocument>(
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
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ScenarioType),
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

scenario.pre<ScenarioDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

scenario.plugin(paginate)

export const Scenario = model<ScenarioDocument>('scenario', scenario)
