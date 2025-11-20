import mongoose, { Document, Schema } from 'mongoose'

export interface UserPreferencesSchema {
  user: Schema.Types.ObjectId
  last_agents: Schema.Types.ObjectId[]
  pinned_agents: Schema.Types.ObjectId[]
  hidden_agents: Schema.Types.ObjectId[]
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
    hidden_agents: {
      type: [Schema.Types.ObjectId],
      ref: 'users3',
      default: [],
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
  const userPrefs = await this.findOne({ user: userId })

  if (!userPrefs) {
    // Create new preferences document
    await this.create({
      user: userId,
      last_agents: [agentId],
    })
    return
  }

  // Remove agentId if it already exists (to avoid duplicates)
  const filteredAgents = userPrefs.last_agents.filter(
    (id: Schema.Types.ObjectId) => id.toString() !== agentId.toString(),
  )

  // Add agentId at the beginning
  const updatedAgents = [agentId, ...filteredAgents]

  // Keep only the first 10
  userPrefs.last_agents = updatedAgents.slice(0, 10)

  await userPrefs.save()
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

// Static method to hide an agent
userPreferencesSchema.statics.hideAgent = async function (
  userId: mongoose.Types.ObjectId,
  agentId: mongoose.Types.ObjectId,
) {
  const userPrefs = await this.findOne({ user: userId })

  if (!userPrefs) {
    await this.create({
      user: userId,
      hidden_agents: [agentId],
    })
    return
  }

  // Check if already hidden
  const isHidden = userPrefs.hidden_agents.some(
    (id: Schema.Types.ObjectId) => id.toString() === agentId.toString(),
  )

  if (!isHidden) {
    userPrefs.hidden_agents.push(agentId)
    await userPrefs.save()
  }
}

export const UserPreferences = mongoose.model<
  UserPreferencesDocument,
  mongoose.Model<UserPreferencesDocument> & {
    updateLastAgent: (
      userId: mongoose.Types.ObjectId,
      agentId: mongoose.Types.ObjectId,
    ) => Promise<void>
    pinAgent: (
      userId: mongoose.Types.ObjectId,
      agentId: mongoose.Types.ObjectId,
    ) => Promise<void>
    unpinAgent: (
      userId: mongoose.Types.ObjectId,
      agentId: mongoose.Types.ObjectId,
    ) => Promise<void>
    hideAgent: (
      userId: mongoose.Types.ObjectId,
      agentId: mongoose.Types.ObjectId,
    ) => Promise<void>
  }
>('UserPreferences', userPreferencesSchema)
