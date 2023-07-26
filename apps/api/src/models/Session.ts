import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'
import { ScenarioDocument } from './Scenario'

export interface SessionSchema {
  scenario: ScenarioDocument
  creator: UserDocument
  createdAt?: Date
  updatedAt?: Date
}

export interface SessionDocument extends SessionSchema, SoftDeleteDocument {}

const session = new Schema<SessionDocument>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'users',
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
