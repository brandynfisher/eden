import { CollectionDocument } from './Collection'
import { CreationDocument } from './Creation'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface UserSchema {
  userId: string
  isWeb2?: boolean
  isAdmin: boolean
  provider?: string
  creations: CreationDocument[]
  collections: CollectionDocument[]
  creationCount?: number
  followerCount: number
  followingCount: number
  featureFlags?: FeatureFlag[]
  subscriptionTier?: SubscriptionTier
  highestMonthlySubscriptionTier?: SubscriptionTier
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  discordId?: string
  username?: string
  userImage?: string
  email?: string
  normalizedEmail?: string
  deleted?: boolean
  createdAt?: Date
  updatedAt?: Date
  lastDailyLoginBonus?: Date
  discordLinkBonusClaimed?: boolean
}

export interface UserInput {
  userId: string
  isWeb2: boolean
  username: string
  userImage?: string
  isClerk?: boolean
  isAdmin?: boolean
  email?: string
  normalizedEmail?: string
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
    email: {
      type: String,
      unique: true,
      maxLength: 320,
    },
    normalizedEmail: {
      type: String,
      unique: true,
      maxLength: 320,
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
    creationCount: {
      type: Number,
      default: 0,
    },
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
      type: Number,
      default: SubscriptionTier.Free,
    },
    highestMonthlySubscriptionTier: {
      type: Number,
      default: SubscriptionTier.Free,
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
    lastDailyLoginBonus: {
      type: Date,
      default: new Date(),
    },
    discordLinkBonusClaimed: {
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
user.index({ followerCount: -1 })
user.index({ creationCount: -1 })

user.plugin(paginate)
user.plugin(aggregatePaginate)

export const User = model<UserDocument>('users', user)
