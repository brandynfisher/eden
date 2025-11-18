import mongoose, { Document, Schema } from 'mongoose'

export interface UserPreferencesSchema {
  user: Schema.Types.ObjectId
  last_agents: Schema.Types.ObjectId[]
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

export const UserPreferences = mongoose.model<
  UserPreferencesDocument,
  mongoose.Model<UserPreferencesDocument> & {
    updateLastAgent: (
      userId: mongoose.Types.ObjectId,
      agentId: mongoose.Types.ObjectId,
    ) => Promise<void>
  }
>('UserPreferences', userPreferencesSchema)
