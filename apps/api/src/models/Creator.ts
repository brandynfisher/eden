import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CollectionDocument } from './Collection'
import { CreationDocument } from './Creation'

export enum FeatureFlag {
  Preview = 'preview',
}

export enum SubscriptionTier {
  Basic = 'basic',
  Pro = 'pro',
  Free = 'free',
}

export interface UserSchema {
  userId: string
  isWeb2: boolean
  isAdmin: boolean
  provider?: string
  creations: CreationDocument[]
  collections: CollectionDocument[]
  followerCount: number
  followingCount: number
  featureFlags?: FeatureFlag[]
  subscriptionTier?: SubscriptionTier
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  discordId?: string
  username?: string
  userImage?: string
  deleted?: boolean
  createdAt?: Date
  updatedAt?: Date
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
    isAdmin: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      maxlength: 42,
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
        enum: Object.values(FeatureFlag),
      },
    ],
    subscriptionTier: {
      type: String,
      enum: Object.values(SubscriptionTier),
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    discordId: {
      type: String,
    },
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
