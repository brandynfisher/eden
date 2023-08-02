import { SessionEventType } from '@edenlabs/eden-sdk'
import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { CharacterDocument } from './Character'
import { CompletionDocument } from './Completion'
import { CreationDocument } from './Creation'
import { ScenarioDocument } from './Scenario'
import { TaskDocument } from './Task'

export interface SessionEventSchema {
  session: ScenarioDocument
  type: SessionEventType
  data: {
    userAdded?: {
      userId: string
    }
    userRemoved?: {
      userId: string
    }
    characterAdded?: {
      character: CharacterDocument
    }
    characterRemoved?: {
      character: CharacterDocument
    }
    userMessage?: {
      userId: string
      message: string
      completion: CompletionDocument
    }
    characterMessage?: {
      character: CharacterDocument
      message: string
      completion: CompletionDocument
    }
    creationRequest?: {
      userId: string
      character: CharacterDocument
      task: TaskDocument
    }
    creationReturn?: {
      userId: string
      character: CharacterDocument
      creation: CreationDocument
    }
  }
  createdAt?: Date
}

export interface SessionEventDocument
  extends SessionEventSchema,
    SoftDeleteDocument {}

const sessionEvent = new Schema<SessionEventDocument>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'sessions',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(SessionEventType),
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

sessionEvent.plugin(paginate)

export const SessionEvent = model<SessionEventDocument>(
  'sessionEvents',
  sessionEvent,
)
