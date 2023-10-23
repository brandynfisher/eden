import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { ConceptDocument } from './Concept'
import { CreationDocument } from './Creation'
import { UserDocument } from './Creator'
import { GeneratorDocument } from './Generator'

export enum TaskStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export interface TaskSchema {
  user: UserDocument
  generator: GeneratorDocument
  versionId: string
  config: Record<string, any>
  taskId: string
  status: TaskStatus
  cost: number
  creation?: CreationDocument
  concept?: ConceptDocument
  webhooks?: string[]
  error?: string
  progress?: number
  output?: any
  samples?: CreationDocument[]
  intermediateOutputs?: any[]
  createdAt?: Date
  updatedAt?: Date
}

export interface TaskInput {
  creator: ObjectId
  generator: ObjectId
  version: ObjectId
  const: number
  config?: Record<string, any>
  webhooks?: string[]
}

export interface TaskDocument extends TaskSchema, Document {}

const task = new Schema<TaskDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    generator: {
      type: Schema.Types.ObjectId,
      ref: 'generators',
    },
    versionId: {
      type: String,
      required: true,
    },
    creation: {
      type: Schema.Types.ObjectId,
      ref: 'creations',
    },
    concept: {
      type: Schema.Types.ObjectId,
      ref: 'concepts',
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    taskId: {
      type: String,
      required: true,
      unique: true,
    },
    webhooks: {
      type: [String],
      default: null,
      maxlength: 10,
    },
    cost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.Pending,
    },
    error: {
      type: String,
      default: null,
    },
    progress: {
      type: Number,
      default: 0,
    },
    output: {
      type: Schema.Types.Mixed,
      default: {},
    },
    samples: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'creations',
          required: true,
        },
      ],
      required: false,
    },
    intermediateOutputs: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

task.pre<TaskDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

task.index({ createdAt: 1 })
task.index({ user: 1, _id: 1, status: 1 })
task.index({ generator: 1 })
task.plugin(paginate)

export const Task = model<TaskDocument>('tasks', task)
