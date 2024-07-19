// import { CharacterDocument } from './Character'
// import { CreationDocument } from './Creation'
// import { TaskAttributes } from '@edenlabs/eden-sdk'
import { UserDocument } from '../Creator'
import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

export enum TaskV2Status {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export type TaskV2Args = {
  // creations
  prompt?: string
  negative_prompt?: string
  width?: number
  height?: number
  seed?: number
  lora?: string | null
  lora_strength?: number
  // models
  name?: string
  lora_training_urls?: string[]
  sd_model_version?: string
  concept_mode?: string
  max_train_steps?: number
  resolution?: number
}

export interface TaskV2Schema {
  user: UserDocument
  workflow: string
  args: TaskV2Args
  result: string | string[]
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
  result: string | string[]
  status?: TaskV2Status
  // cost: number
  error?: string
  progress?: number
}

export interface TaskV2Document extends TaskV2Schema, Document {}

export type TaskV2 = {
  _id: string
  user: string
  workflow: string
  args: TaskV2Args
  status: TaskV2Status
  error: string | null
  result: string | string[]
  createdAt: Date
  updatedAt: Date
}

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
      type: Schema.Types.Mixed,
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
