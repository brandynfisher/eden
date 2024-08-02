import { TaskV2Args, TaskV2Result } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface CreationV2Schema extends TaskV2Result {
  user: ObjectId
  task: ObjectId
  args: TaskV2Args
  createdAt: Date
  updatedAt: Date
}

export interface CreationV2Input extends TaskV2Result {
  user: ObjectId
  task: ObjectId
  args: TaskV2Args
}

export interface CreationV2Document extends CreationV2Schema, Document {}

export type CreationV2 = TaskV2Result & {
  _id: string
  user: ObjectId
  task: ObjectId
  args: TaskV2Args
  createdAt: Date
  updatedAt: Date
}

export const creationSchema = new Schema<CreationV2Document>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'tasks',
      required: true,
    },
    args: {
      type: Schema.Types.Mixed,
      default: {},
    },
    url: {
      type: String,
      maxlength: 1000,
    },
    thumbnail: {
      type: String,
      maxlength: 1000,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    mediaAttributes: {
      mimeType: {
        type: String,
        required: true,
      },
      // type: {
      //   type: String,
      //   enum: Object.values(MediaType),
      //   required: true,
      // },
      duration: {
        type: Number,
      },
      width: {
        type: Number,
      },
      height: {
        type: Number,
      },
      aspectRatio: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  },
)

creationSchema.index({ createdAt: -1 })
creationSchema.index({ user: 1, task: -1, createdAt: -1 })
creationSchema.plugin(paginate)
creationSchema.plugin(aggregatePaginate)

export const CreationV2 = model<CreationV2Document>(
  'creations2',
  creationSchema,
)
