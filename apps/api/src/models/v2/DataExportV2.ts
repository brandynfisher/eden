import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'

export type DataExportStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled'

export type DataExportMediaType = 'images' | 'videos' | 'audio'

export interface DataExportFilters {
  include_chats: boolean
  include_media_files: boolean
  media_types: DataExportMediaType[]
  agent_ids?: ObjectId[]
  created_after?: Date | null
  created_before?: Date | null
}

export interface DataExportCounts {
  sessions: number
  messages: number
  creations: number
  files: number
  bytes: number
}

export interface DataExportArchive {
  bucket: string
  key: string
  filename: string
  size_bytes: number
  sha256?: string | null
  expires_at: Date
}

export interface DataExportSchema {
  user: ObjectId
  eden_user_id?: ObjectId | null
  status: DataExportStatus
  filters: DataExportFilters
  counts?: DataExportCounts | null
  archive?: DataExportArchive | null
  error?: string | null
  download_count?: number
  last_downloaded_at?: Date | null
  started_at?: Date | null
  completed_at?: Date | null
  expires_at?: Date | null
  cancelled_at?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface DataExportDocument extends DataExportSchema, Document {}

const dataExportSchema = new Schema<DataExportDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
      index: true,
    },
    eden_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      index: true,
      default: null,
    },
    status: {
      type: Schema.Types.String,
      enum: [
        'queued',
        'running',
        'completed',
        'failed',
        'expired',
        'cancelled',
      ],
      required: true,
      default: 'queued',
      index: true,
    },
    filters: {
      type: Schema.Types.Mixed,
      required: true,
    },
    counts: {
      type: Schema.Types.Mixed,
      default: null,
    },
    archive: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: Schema.Types.String,
      default: null,
    },
    download_count: {
      type: Schema.Types.Number,
      default: 0,
    },
    last_downloaded_at: {
      type: Date,
      default: null,
    },
    started_at: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    expires_at: {
      type: Date,
      default: null,
      index: true,
    },
    cancelled_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'data_exports',
  },
)

dataExportSchema.index({ user: 1, createdAt: -1 })
dataExportSchema.index({ user: 1, status: 1, createdAt: -1 })

dataExportSchema.pre('save', function (next) {
  if (!this.eden_user_id && this.user) {
    this.eden_user_id = this.user as unknown as ObjectId
  }
  next()
})

export const DataExportV2 = model<DataExportDocument>(
  'data_exports',
  dataExportSchema,
)
