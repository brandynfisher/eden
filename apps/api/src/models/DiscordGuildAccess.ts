import { Schema, Types, model } from 'mongoose'

export interface DiscordGuildAccessSchema {
  guild_id: string
  allowed_role_ids: string[]
  updated_by_user_id?: Types.ObjectId
  updated_by_discord_id?: string
  createdAt: Date
  updatedAt: Date
}

export interface DiscordGuildAccessDocument extends DiscordGuildAccessSchema {}

const discordGuildAccessSchema = new Schema<DiscordGuildAccessDocument>(
  {
    guild_id: {
      type: String,
      required: true,
      unique: true,
      maxlength: 80,
    },
    allowed_role_ids: {
      type: [String],
      default: [],
    },
    updated_by_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
    },
    updated_by_discord_id: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

discordGuildAccessSchema.index({ guild_id: 1 })

export const DiscordGuildAccess = model<DiscordGuildAccessDocument>(
  'discord_guild_access',
  discordGuildAccessSchema,
  'discord_guild_access',
)
