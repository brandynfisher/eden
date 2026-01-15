import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface ArtifactV3Schema {
  owner: ObjectId
  title: string
  type: string
  public: boolean
  session?: ObjectId
  originSession?: ObjectId
  items: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  deleted?: boolean
}

export interface ArtifactV3Input {
  owner: ObjectId
  title: string
  type: string
  public?: boolean
  session?: ObjectId
  originSession?: ObjectId
  items?: Record<string, unknown>
}

export interface ArtifactV3Document
  extends SoftDeleteDocument,
    ArtifactV3Schema {}

export const artifactV3Schema = new Schema<ArtifactV3Document>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      required: true,
      maxlength: 100,
    },
    public: {
      type: Boolean,
      default: false,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'sessions',
      required: false,
    },
    originSession: {
      type: Schema.Types.ObjectId,
      ref: 'sessions',
      required: false,
    },
    items: {
      type: Schema.Types.Mixed,
      default: {},
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

artifactV3Schema.index({ owner: 1, createdAt: -1 })
artifactV3Schema.index({ type: 1, createdAt: -1 })
artifactV3Schema.index({ session: 1 })
artifactV3Schema.index({ originSession: 1 })
artifactV3Schema.index({ public: 1, deleted: 1, createdAt: -1 })

artifactV3Schema.plugin(paginate)
artifactV3Schema.plugin(aggregatePaginate)
artifactV3Schema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const ArtifactV3 = model<ArtifactV3Document>(
  'artifacts_v3',
  artifactV3Schema,
) as SoftDeleteModel<ArtifactV3Document>
