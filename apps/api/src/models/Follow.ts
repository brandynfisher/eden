import { UserDocument } from './Creator'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

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

follow.index({ createdAt: -1 })
follow.index({ follower: 1, following: 1 })

follow.plugin(paginate)
follow.plugin(aggregatePaginate)

export const Follow = model<FollowDocument>('follows', follow)
