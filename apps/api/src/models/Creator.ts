import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CollectionDocument } from './Collection'
import { CreationDocument } from './Creation'

export interface UserSchema {
  userId: string
  isWallet: boolean
  isAdmin: boolean
  creations: CreationDocument[]
  collections: CollectionDocument[]
  username?: string
  name?: string
  bio?: string
  email?: string
  profilePictureUri?: string
  coverPictureUri?: string
  website?: string
  discordId?: string
  twitterId?: string
  instagramId?: string
  githubId?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserInput {
  userId: string
  username: string
  isWallet: boolean
  isAdmin?: boolean
}

export interface UserDocument extends UserSchema, Document {}

const user = new Schema<UserDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    isWallet: {
      type: Boolean,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    username: {
      type: String,
      required: false,
      unique: true,
    },
    name: {
      type: String,
    },
    bio: {
      type: String,
    },
    email: {
      type: String,
    },
    profilePictureUri: {
      type: String,
    },
    coverPictureUri: {
      type: String,
    },
    website: {
      type: String,
    },
    discordId: {
      type: String,
    },
    twitterId: {
      type: String,
    },
    instagramId: {
      type: String,
    },
    githubId: {
      type: String,
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
