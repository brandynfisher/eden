import { TaskV2Args, TaskV2Result } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

type BaseTaskResult = Omit<TaskV2Result, 'creation' | 'model'>

export interface CreationV2Schema extends BaseTaskResult {
  user: ObjectId
  task: ObjectId
  args: TaskV2Args
  workflow: string
  createdAt: Date
  updatedAt: Date
  public?: boolean
}

export interface CreationV2Input extends BaseTaskResult {
  user: ObjectId
  task: ObjectId
  args: TaskV2Args
  workflow: string
}

export interface CreationV2Document
  extends SoftDeleteDocument,
    CreationV2Schema {}

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
    workflow: {
      type: String,
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
      type: {
        type: String,
        required: true,
      },
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
    deleted: {
      type: Boolean,
      default: false,
    },
    public: {
      type: Boolean,
      default: true,
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
creationSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const CreationV2 = model<CreationV2Document>(
  'creations2',
  creationSchema,
) as SoftDeleteModel<CreationV2Document>
