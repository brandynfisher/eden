import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'

export enum ArtifactPermissionLevelV3 {
  Viewer = 'viewer',
  Editor = 'editor',
  Owner = 'owner',
}

export interface ArtifactPermissionV3Schema {
  artifact: ObjectId
  subject: ObjectId
  level: ArtifactPermissionLevelV3
  grantedBy: ObjectId
  grantedAt: Date
}

export interface ArtifactPermissionV3Document
  extends ArtifactPermissionV3Schema,
    Document {}

const ArtifactPermissionV3Schema = new Schema<ArtifactPermissionV3Document>(
  {
    artifact: {
      type: Schema.Types.ObjectId,
      ref: 'artifacts_v3',
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    level: {
      type: String,
      enum: Object.values(ArtifactPermissionLevelV3),
      required: true,
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

ArtifactPermissionV3Schema.index({ artifact: 1, subject: 1 }, { unique: true })
ArtifactPermissionV3Schema.index({ artifact: 1, level: 1 })
ArtifactPermissionV3Schema.index({ subject: 1, level: 1 })

export const ArtifactPermissionV3 = model<ArtifactPermissionV3Document>(
  'artifact_permissions',
  ArtifactPermissionV3Schema,
)
