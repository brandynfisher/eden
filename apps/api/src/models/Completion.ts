import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

import { GeneratorDocument } from './Generator'

export interface CompletionSchema {
  prompt: string
  completion: string
  generator: GeneratorDocument
  versionId: string
  config: any
  createdAt?: Date
}

export interface CompletionInput {
  prompt: string
  completion: string
  generator: ObjectId
  version: ObjectId
  config: any
}

export interface CompletionDocument extends CompletionSchema, Document {}

const completion = new Schema<CompletionDocument>(
  {
    prompt: {
      type: String,
      required: true,
    },
    completion: {
      type: String,
      required: true,
    },
    generator: {
      type: Schema.Types.ObjectId,
      ref: 'generators',
    },
    versionId: {
      type: String,
      required: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

completion.plugin(paginate)
completion.plugin(aggregatePaginate)

export const Completion = model<CompletionDocument>('completions', completion)
