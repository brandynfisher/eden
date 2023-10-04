import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'

export interface UploadSchema {
  user: UserDocument
  uri: string
  mediaAttributes: MediaAttributes
  createdAt?: Date
  updatedAt?: Date
}

export interface UploadDocument extends UploadSchema, Document {}

const upload = new Schema<UploadDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    uri: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    mediaAttributes: {
      type: {
        type: String,
        enum: Object.values(MediaType),
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
  },
  {
    timestamps: true,
  },
)

upload.pre<UploadDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

upload.index({ createdAt: 1 })
upload.index({ user: 1 })

upload.plugin(paginate)
upload.plugin(aggregatePaginate)

export const Upload = model<UploadDocument>('uploads', upload)
