import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CollectionDocument } from './Collection'
import { CreationDocument } from './Creation'

export interface UserSchema {
  userId: string
  isWeb2: boolean
  isAdmin: boolean
  creations: CreationDocument[]
  collections: CollectionDocument[]
  followerCount: number
  followingCount: number
  username?: string
  userImage?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserInput {
  userId: string
  isWeb2: boolean
  username: string
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
  },
  {
    timestamps: true,
  },
)

user.pre<UserDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

user.plugin(paginate)

export const User = model<UserDocument>('users', user)
