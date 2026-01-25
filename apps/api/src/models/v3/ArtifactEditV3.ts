/**
 * @deprecated This model is deprecated and will be removed in a future version.
 * Use ArtifactVersionV3 instead for tracking artifact history as full snapshots.
 * This model is kept for backwards compatibility during migration.
 */
import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

/**
 * @deprecated Use ArtifactVersionV3 instead
 */
export type ArtifactEditOperationV3 = {
  op: 'set' | 'unset'
  path: string
  value?: string
}

/**
 * @deprecated Use ArtifactVersionV3 instead
 */
export interface ArtifactEditV3Schema {
  artifact: ObjectId
  actor: ObjectId
  patch: ArtifactEditOperationV3[]
  reason?: string
  createdAt: Date
}

export interface ArtifactEditV3Document
  extends ArtifactEditV3Schema,
    Document {}

const ArtifactEditV3Schema = new Schema<ArtifactEditV3Document>(
  {
    artifact: {
      type: Schema.Types.ObjectId,
      ref: 'artifacts_v3',
      required: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    patch: {
      type: [Schema.Types.Mixed] as any,
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

ArtifactEditV3Schema.index({ artifact: 1, createdAt: -1 })
ArtifactEditV3Schema.index({ actor: 1, createdAt: -1 })

ArtifactEditV3Schema.plugin(paginate)

export const ArtifactEditV3 = model<ArtifactEditV3Document>(
  'artifact_edits_v3',
  ArtifactEditV3Schema,
)
