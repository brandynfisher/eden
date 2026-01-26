import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

export type JsonPatchOp = {
  op: 'add' | 'remove' | 'replace'
  path: string
  value?: unknown
}

export interface ArtifactVersionV3Schema {
  artifact: ObjectId
  version: number
  items: Record<string, unknown>
  operations?: JsonPatchOp[]
  actor: ObjectId
  reason?: string
  createdAt: Date
}

export interface ArtifactVersionV3Document
  extends ArtifactVersionV3Schema,
    Document {}

const ArtifactVersionV3Schema = new Schema<ArtifactVersionV3Document>(
  {
    artifact: {
      type: Schema.Types.ObjectId,
      ref: 'artifacts_v3',
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    items: {
      type: Schema.Types.Mixed,
      required: true,
    },
    operations: {
      type: Schema.Types.Mixed,
      required: false,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    reason: {
      type: String,
      required: false,
      maxlength: 2000,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

ArtifactVersionV3Schema.index({ artifact: 1, version: -1 })
ArtifactVersionV3Schema.index({ artifact: 1, createdAt: -1 })
ArtifactVersionV3Schema.index({ actor: 1, createdAt: -1 })

ArtifactVersionV3Schema.plugin(paginate)

export const ArtifactVersionV3 = model<ArtifactVersionV3Document>(
  'artifact_versions_v3',
  ArtifactVersionV3Schema,
)
