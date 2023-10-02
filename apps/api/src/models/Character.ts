import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import mongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'
// @ts-ignore
import slug from 'mongoose-slug-plugin'

import { VisibilitySchema } from '../types/baseSchemas'
import { UserDocument } from './Creator'
import { UploadDocument } from './Upload'

interface ChatSchema {
  sender: string
  message: string[]
}

export interface CharacterSchema extends VisibilitySchema {
  user: UserDocument
  name: string
  slug: string
  description?: string
  greeting?: string
  dialogue?: ChatSchema[]
  image?: UploadDocument
  voice?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CharacterInput {
  user: ObjectId
  name: string
  description?: string
  greeting?: string
  dialogue?: ChatSchema[]
  image?: UploadDocument
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
    description: {
      type: String,
      maxlength: 1000,
    },
    image: {
      type: Schema.Types.ObjectId,
      ref: 'uploads',
      required: false,
    },
    voice: {
      type: String,
      required: false,
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

character.index({ user: 1, name: 1 }, { unique: true })

character.plugin(mongooseDelete, { overrideMethods: 'all' })
character.plugin(paginate)
character.plugin(slug, { tmpl: '<%=name%>' })

export const Character = model<CharacterDocument>('characters', character)
