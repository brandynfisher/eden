import { ScenarioType } from '@edenlabs/eden-sdk'
import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'

export interface SessionSchema {
  user: UserDocument
  type: ScenarioType
  createdAt?: Date
  updatedAt?: Date
}

export interface SessionDocument extends SessionSchema, SoftDeleteDocument {}

const session = new Schema<SessionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ScenarioType),
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

session.pre<SessionDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

session.plugin(paginate)

export const Session = model<SessionDocument>('sessions', session)
