// import { CharacterDocument } from './Character'
// import { ConceptDocument } from './Concept'
// import { CreationDocument } from './Creation'
import { UserDocument } from '../Creator'
import { ObjectId } from 'mongodb'
// import { TaskAttributes } from '@edenlabs/eden-sdk'
// import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

export enum TaskV2Status {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export type TaskV2Args = {
  prompt?: string
  negative_prompt?: string
  width?: number
  height?: number
  seed?: number
  lora?: string | null
  lora_strength?: number
}

export interface TaskV2Schema {
  user: UserDocument
  workflow: string
  args: TaskV2Args
  result: string[]
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
  result: string[]
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
  args: {
    prompt?: string
    negative_prompt?: string
    width?: number
    height?: number
    seed?: number
    lora?: string | null
    lora_strength?: number
  }
  status: TaskV2Status
  error: string | null
  result: string[]
  createdAt: Date
  updatedAt: Date
}

const task = new Schema<TaskV2Document>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    workflow: {
      type: String,
      required: true,
    },
    args: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: Object.values(TaskV2Status),
      default: TaskV2Status.Pending,
    },
    error: {
      type: String,
      default: null,
    },
    progress: {
      type: Number,
      default: 0,
    },
    result: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

task.index({ createdAt: -1 })
task.index({ user: 1, status: 1, creation: 1, concept: 1, createdAt: -1 })
task.index({ status: 1, createdAt: -1 })
task.plugin(paginate)

export const TaskV2 = model<TaskV2Document>('tasksV2', task)
