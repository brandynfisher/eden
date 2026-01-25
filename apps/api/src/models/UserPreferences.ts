import mongoose, { Document, Schema } from 'mongoose'

export type SessionPlatformFilter =
  | 'web'
  | 'discord'
  | 'telegram'
  | 'twitter'
  | 'farcaster'

export interface UserPreferencesSchema {
  user: Schema.Types.ObjectId
  last_agents: Schema.Types.ObjectId[]
  pinned_agents: Schema.Types.ObjectId[]
  notification_preferences?: {
    new_creation: boolean
    new_message: boolean
    session_permissions: boolean
    agent_permissions: boolean
  }
  session_platform_filters?: SessionPlatformFilter[]
  createdAt?: Date
  updatedAt?: Date
}

export interface UserPreferencesDocument
  extends UserPreferencesSchema,
    Document {}

const userPreferencesSchema = new Schema<UserPreferencesDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
      unique: true,
      index: true,
    },
    last_agents: {
      type: [Schema.Types.ObjectId],
      ref: 'users3',
      default: [],
      validate: {
        validator: function (v: Schema.Types.ObjectId[]) {
          return v.length <= 10
        },
        message: 'last_agents can contain at most 10 agents',
      },
    },
    pinned_agents: {
      type: [Schema.Types.ObjectId],
      ref: 'users3',
      default: [],
    },
    notification_preferences: {
      type: {
        new_creation: {
          type: Boolean,
          default: true,
        },
        new_message: {
          type: Boolean,
          default: true,
        },
        session_permissions: {
          type: Boolean,
          default: true,
        },
        agent_permissions: {
          type: Boolean,
          default: true,
        },
      },
      default: () => ({
        new_creation: true,
        new_message: true,
        session_permissions: true,
        agent_permissions: true,
      }),
    },
    session_platform_filters: {
      type: [String],
      enum: ['web', 'discord', 'telegram', 'twitter', 'farcaster'],
      default: ['web', 'discord', 'telegram', 'twitter', 'farcaster'],
    },
  },
  {
    timestamps: true,
    collection: 'user_preferences',
  },
)

// Index for efficient lookups
userPreferencesSchema.index({ user: 1 })

// Static method to update last agents for a user
userPreferencesSchema.statics.updateLastAgent = async function (
  userId: mongoose.Types.ObjectId,
  agentId: mongoose.Types.ObjectId,
) {
  // Step 1: ensure document exists
  const upsertResult = await this.updateOne(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true },
  )

  // Step 2: remove existing occurrence to avoid duplicates
  const pullResult = await this.updateOne(
    { user: userId },
    { $pull: { last_agents: agentId } },
  )

  // Step 3: prepend and cap the list
  const pushResult = await this.updateOne(
    { user: userId },
    {
      $push: {
        last_agents: { $each: [agentId], $position: 0, $slice: 10 },
      },
    },
  )

  const doc = await this.findOne({ user: userId })
    .select('_id user last_agents pinned_agents updatedAt')
    .lean()

  return { upsertResult, pullResult, pushResult, doc }
}

// Static method to pin an agent
userPreferencesSchema.statics.pinAgent = async function (
  userId: mongoose.Types.ObjectId,
  agentId: mongoose.Types.ObjectId,
) {
  const userPrefs = await this.findOne({ user: userId })

  if (!userPrefs) {
    await this.create({
      user: userId,
      pinned_agents: [agentId],
    })
    return
  }

  // Check if already pinned
  const isPinned = userPrefs.pinned_agents.some(
    (id: Schema.Types.ObjectId) => id.toString() === agentId.toString(),
  )

  if (!isPinned) {
    userPrefs.pinned_agents.push(agentId)
    await userPrefs.save()
  }
}

// Static method to unpin an agent
userPreferencesSchema.statics.unpinAgent = async function (
  userId: mongoose.Types.ObjectId,
  agentId: mongoose.Types.ObjectId,
) {
  const userPrefs = await this.findOne({ user: userId })

  if (!userPrefs) {
    return
  }

  userPrefs.pinned_agents = userPrefs.pinned_agents.filter(
    (id: Schema.Types.ObjectId) => id.toString() !== agentId.toString(),
  )

  await userPrefs.save()
}

// Static method to update session platform filters
userPreferencesSchema.statics.updatePlatformFilters = async function (
  userId: mongoose.Types.ObjectId,
  platforms: SessionPlatformFilter[],
) {
  return this.findOneAndUpdate(
    { user: userId },
    { $set: { session_platform_filters: platforms } },
    { upsert: true, new: true },
  )
}

export const UserPreferences = mongoose.model<
  UserPreferencesDocument,
  mongoose.Model<UserPreferencesDocument> & {
    updateLastAgent: (
      userId: mongoose.Types.ObjectId,
      agentId: mongoose.Types.ObjectId,
    ) => Promise<unknown>
    pinAgent: (
      userId: mongoose.Types.ObjectId,
      agentId: mongoose.Types.ObjectId,
    ) => Promise<void>
    unpinAgent: (
      userId: mongoose.Types.ObjectId,
      agentId: mongoose.Types.ObjectId,
    ) => Promise<void>
    updatePlatformFilters: (
      userId: mongoose.Types.ObjectId,
      platforms: SessionPlatformFilter[],
    ) => Promise<UserPreferencesDocument>
  }
>('UserPreferences', userPreferencesSchema)
