import { ObjectId, Schema, model } from 'mongoose'

export enum DeploymentPlatform {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  FARCASTER = 'farcaster',
}

export interface DeploymentSchema {
  agent: ObjectId
  platform: DeploymentPlatform
}

export interface DeploymentDocument extends DeploymentSchema {}

const DeploymentSchema = new Schema<DeploymentDocument>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: Object.values(DeploymentPlatform),
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
