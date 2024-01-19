import { VisibilitySchema } from '../types/baseSchemas'
import { CharacterVersionDocument } from './CharacterVersion'
import { UserDocument } from './Creator'
import { Capabilities, LogosData } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'
// @ts-ignore
import slug from 'mongoose-slug-plugin'

export interface CharacterSchema extends VisibilitySchema {
  user: UserDocument
  name: string
  slug: string
  versions: CharacterVersionDocument[]
  creationCount?: number
  praiseCount?: number
  bookmarkCount?: number
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
    versions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'characterVersions',
      },
    ],
    creationCount: {
      type: Number,
      default: 0,
    },
    praiseCount: {
      type: Number,
      default: 0,
    },
    bookmarkCount: {
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

character.index({ createdAt: 1 })
character.index({ user: 1, deleted: 1, isPrivate: 1 })
character.index({ deleted: 1, isPrivate: 1 })
character.index({
  createdAt: -1,
  creationCount: -1,
})

// character.plugin(mongooseDelete, { overrideMethods: 'all' })
character.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})
character.plugin(paginate)
character.plugin(aggregatePaginate)
character.plugin(slug, {
  tmpl: '<%=name%>',
  history: false,
})

export const Character = model<CharacterDocument>(
  'characters',
  character,
) as SoftDeleteModel<CharacterDocument>
