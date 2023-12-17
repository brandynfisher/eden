import { Capabilites, LogosData } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import mongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'
// @ts-ignore
import slug from 'mongoose-slug-plugin'

import { VisibilitySchema } from '../types/baseSchemas'
import { UserDocument } from './Creator'

interface ChatSchema {
  sender: string
  message: string[]
}
export interface CharacterSchema extends VisibilitySchema {
  user: UserDocument
  name: string
  slug: string
  greeting?: string
  dialogue?: ChatSchema[]
  logosData?: LogosData
  image?: string
  voice?: string
  creationCount?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface CharacterInput {
  user: ObjectId | UserDocument
  name: string
  description?: string
  greeting?: string
  dialogue?: ChatSchema[]
  logosData?: LogosData
  image?: string
  voice?: string
}

export interface CharacterDocument
  extends SoftDeleteDocument,
    CharacterSchema {}

const character = new Schema<CharacterDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 80,
    },
    slug: { type: String, unique: true },
    greeting: {
      type: String,
      maxlength: 1000,
    },
    dialogue: {
      type: Array,
      required: false,
    },
    logosData: {
      type: {
        capabilities: {
          type: Array,
          values: Object.values(Capabilites),
          required: false,
        },
        identity: {
          type: String,
          maxlength: 9999,
          required: false,
        },
        knowledge: {
          type: String,
          maxlength: 99990,
          required: false,
        },
        knowledgeSummary: {
          type: String,
          maxlength: 99999,
          required: false,
        },
        concept: {
          type: String,
          maxlength: 1000,
          required: false,
        },
      },
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    voice: {
      type: String,
      required: false,
    },
    creationCount: {
      type: Number,
      default: 0,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deleteBy: {
      type: String,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

character.pre<CharacterDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

character.plugin(mongooseDelete, { overrideMethods: 'all' })
character.plugin(paginate)
character.plugin(slug, {
  tmpl: '<%=name%>',
})

export const Character = model<CharacterDocument>('characters', character)
