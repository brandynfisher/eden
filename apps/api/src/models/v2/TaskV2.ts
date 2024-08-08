import { UserDocument } from '../Creator'
import { TaskV2Args, TaskV2Result, TaskV2Status } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export interface TaskV2Schema {
  user: UserDocument
  workflow: string
  args: TaskV2Args
  result: TaskV2Result[]
  status: TaskV2Status
  // cost: number
  error?: string
  progress?: number
  createdAt: Date
  updatedAt: Date
}

export interface TaskV2Input {
  user: ObjectId
  workflow: string
  args: TaskV2Args
  result: TaskV2Result[]
  status?: TaskV2Status
  // cost: number
  error?: string
  progress?: number
}

export interface TaskV2Document extends TaskV2Schema, Document {}

export const taskSchema = new Schema<TaskV2Document>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    workflow: {
      type: Schema.Types.String,
      required: true,
    },
    args: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: Schema.Types.String,
      enum: Object.values(TaskV2Status),
      default: TaskV2Status.Pending,
    },
    error: {
      type: Schema.Types.String,
      default: null,
    },
    progress: {
      type: Schema.Types.Number,
      default: 0,
    },
    result: {
      type: [],
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

taskSchema.index({ createdAt: -1 })
taskSchema.index({ user: 1, status: 1, workflow: 1, createdAt: -1 })
taskSchema.index({ status: 1, createdAt: -1 })
taskSchema.plugin(paginate)
taskSchema.plugin(aggregatePaginate)

export const TaskV2 = model<TaskV2Document>('tasks2', taskSchema)
