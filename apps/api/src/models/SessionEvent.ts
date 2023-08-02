import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { CharacterDocument } from './Character'
import { CreationDocument } from './Creation'
import { UserDocument } from './Creator'
import { ScenarioDocument } from './Scenario'
import { TaskDocument } from './Task'

export enum SessionEventType {
  CREATE = 'create',
  END = 'end',
  USER_ADD = 'user_add',
  USER_REMOVE = 'user_remove',
  CHARACTER_ADD = 'character_add',
  CHARACTER_REMOVE = 'character_remove',
  USER_MESSAGE = 'user_message',
  CHARACTER_MESSAGE = 'character_message',
  CREATION_REQUEST = 'creation_request',
  CREATION_RETURN = 'creation_return',
}

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
  }
  characterMessage?: {
    character: CharacterDocument
    message: string
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
