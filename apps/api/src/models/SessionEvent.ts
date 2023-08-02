import { SessionEventType } from '@edenlabs/eden-sdk'
import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { CharacterDocument } from './Character'
import { CompletionDocument } from './Completion'
import { CreationDocument } from './Creation'
import { UserDocument } from './Creator'
import { ScenarioDocument } from './Scenario'
import { TaskDocument } from './Task'

export interface SessionEventSchema {
  session: ScenarioDocument
  type: SessionEventType
  createdAt?: Date
  userAdded?: {
    user: UserDocument
  }
  userRemoved?: {
    user: UserDocument
  }
  characterAdded?: {
    character: CharacterDocument
  }
  characterRemoved?: {
    character: CharacterDocument
  }
  userMessage?: {
    user: UserDocument
    message: string
    completion: CompletionDocument
  }
  characterMessage?: {
    character: CharacterDocument
    message: string
    completion: CompletionDocument
  }
  creationRequest?: {
    user: UserDocument
    character: CharacterDocument
    task: TaskDocument
  }
  creationReturn?: {
    user: UserDocument
    character: CharacterDocument
    creation: CreationDocument
  }
}

export interface SessionEventDocument
  extends SessionEventSchema,
    SoftDeleteDocument {}

const sessionEvent = new Schema<SessionEventDocument>(
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

sessionEvent.pre<SessionEventDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

sessionEvent.plugin(paginate)

export const SessionEvent = model<SessionEventDocument>(
  'sessionEvents',
  sessionEvent,
)
