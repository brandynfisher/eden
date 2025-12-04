import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'

export interface DeviceTokenSchema {
  user: ObjectId
  push_token: string
  platform: 'ios' | 'android' | 'web'
  device_id?: string
  active: boolean
}

export interface DeviceTokenDocument extends DeviceTokenSchema {}

const DeviceTokenSchema = new Schema<DeviceTokenDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    push_token: {
      type: String,
      required: true,
      unique: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    device_id: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

DeviceTokenSchema.index({ user: 1 })
DeviceTokenSchema.index({ push_token: 1 })

export const DeviceToken = model<DeviceTokenDocument>(
  'devicetokens',
  DeviceTokenSchema,
)
