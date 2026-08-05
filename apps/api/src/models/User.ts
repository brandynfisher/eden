import { BaseUser, BaseUserDocument, BaseUserSchema } from './BaseUser'
import { GenerationPreferences, SubscriptionTier } from '@edenlabs/eden-sdk'
import { Schema, Types } from 'mongoose'

export interface UserSchema extends BaseUserSchema {
  userId: string
  email?: string
  normalizedEmail?: string
  isWeb2?: boolean
  isAdmin: boolean
  provider?: string
  subscriptionTier?: SubscriptionTier
  highestMonthlySubscriptionTier?: SubscriptionTier
  preferences?: {
    agent_spend_threshold?: number
    generation?: GenerationPreferences
  }
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  lastDailyLoginBonus?: Date
  discordLinkBonusClaimed?: boolean
  twitterLinkBonusClaimed?: boolean
  type?: 'agent' | 'user'
}

export type UserInput = {
  userId: string
  isWeb2: boolean
  username: string
  userImage?: string
  isClerk?: boolean
  isAdmin?: boolean
  email?: string
  normalizedEmail?: string
  type?: 'agent' | 'user'
  eden_user_id?: Types.ObjectId | string
}

export interface UserDocument extends UserSchema, BaseUserDocument {}

const UserSchema = new Schema<UserDocument>(
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
    subscriptionTier: {
      type: Number,
      default: SubscriptionTier.Free,
    },
    highestMonthlySubscriptionTier: {
      type: Number,
      default: SubscriptionTier.Free,
    },
    preferences: {
      type: {
        agent_spend_threshold: {
          type: Number,
          default: 50,
        },
        generation: {
          type: {
            default_quality: {
              type: String,
              enum: ['standard', 'pro'],
            },
            image_model_preference: {
              type: String,
              enum: ['nano_banana', 'seedream', 'openai', 'flux', 'sdxl', null],
            },
            video_model_preference: {
              type: String,
              enum: ['kling', 'wan', 'seedance', 'veo', 'runway', null],
            },
          },
          required: false,
          _id: false,
        },
      },
      default: () => ({ agent_spend_threshold: 50 }),
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    // No default: `default: new Date()` evaluated once at module load, so every
    // user created by a given process got that process's boot timestamp rather
    // than their own. When the API restarted on the same UTC day a new signup
    // was created, `isSameUtcDay` matched and they were denied their first daily
    // bonus. Leaving it unset lets the first claim through, which is the intent.
    lastDailyLoginBonus: {
      type: Date,
    },
    discordLinkBonusClaimed: {
      type: Boolean,
      default: false,
    },
    twitterLinkBonusClaimed: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    discriminatorKey: 'type',
    timestamps: true,
  },
)

UserSchema.index({ userId: 1 })
UserSchema.index({ email: 1 })
UserSchema.index({ normalizedEmail: 1 })

export const User = BaseUser.discriminator<UserDocument>('user', UserSchema)
