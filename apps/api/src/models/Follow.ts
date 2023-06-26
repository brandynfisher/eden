import { Document, Schema, model } from 'mongoose'

import { UserDocument } from './Creator'

export interface FollowSchema {
  follower: UserDocument
  following: UserDocument
  createdAt?: Date
}

export interface FollowDocument extends FollowSchema, Document {}

const follow = new Schema<FollowDocument>({
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Follow = model<FollowDocument>('follows', follow)
