import { ObjectId, Schema, model } from 'mongoose'

export enum DeploymentPlatform {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  FARCASTER = 'farcaster',
  TWITTER = 'twitter',
}

export interface DeploymentSchema {
  agent: ObjectId
  user: ObjectId
  platform: DeploymentPlatform
  secrets: Record<string, any>
  config: Record<string, any>
}

export interface DeploymentDocument extends DeploymentSchema {}

const DeploymentSchema = new Schema<DeploymentDocument>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: Object.values(DeploymentPlatform),
    },
    secrets: {
      type: Object,
    },
    config: {
      type: Object,
    },
  },
  {
    timestamps: true,
  },
)

DeploymentSchema.index({ agent: 1 })

export const Deployment = model<DeploymentDocument>(
  'deployments',
  DeploymentSchema,
)
