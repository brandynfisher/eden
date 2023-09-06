import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CollectionDocument } from './Collection'
import { CreationDocument } from './Creation'

export interface UserSchema {
  userId: string
  isWeb2: boolean
  isClerk?: boolean
  isAdmin: boolean
  creations: CreationDocument[]
  collections: CollectionDocument[]
  followerCount: number
  followingCount: number
  featureFlags?: string[]
  username?: string
  userImage?: string
  createdAt?: Date
  updatedAt?: Date
  deleted?: boolean
}

export interface UserInput {
  userId: string
  isWeb2: boolean
  username: string
  userImage?: string
  isClerk?: boolean
  isAdmin?: boolean
}

export interface UserDocument extends UserSchema, Document {}

const user = new Schema<UserDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      maxlength: 42,
    },
    isWeb2: {
      type: Boolean,
      required: true,
    },
    isClerk: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      unique: true,
      maxlength: 42,
    },
    userImage: {
      type: String,
      maxlength: 1000,
    },
    creations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'creations',
      },
    ],
    collections: [
      {
        type: Schema.Types.ObjectId,
        ref: 'collections',
      },
    ],
    followerCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    featureFlags: [
      {
        type: String,
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

user.pre<UserDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

user.index({ createdAt: 1 })

user.plugin(paginate)

export const User = model<UserDocument>('users', user)
