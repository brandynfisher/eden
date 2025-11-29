import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface ArtifactCreation {
  creation: ObjectId
  caption?: string
}

export interface ArtifactV2Schema {
  user: ObjectId
  title: string
  type: string
  parent?: ObjectId
  agents: ObjectId[]
  public: boolean
  description?: string
  session?: ObjectId
  creations: ArtifactCreation[]
  createdAt: Date
  updatedAt: Date
  deleted?: boolean
}

export interface ArtifactV2Input {
  user: ObjectId
  title: string
  type: string
  parent?: ObjectId
  agents?: ObjectId[]
  public?: boolean
  description?: string
  session?: ObjectId
  creations?: ArtifactCreation[]
}

export interface ArtifactV2Document
  extends SoftDeleteDocument,
    ArtifactV2Schema {}

export const artifactSchema = new Schema<ArtifactV2Document>(
  {
    user: {
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
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'artifacts',
      required: false,
    },
    agents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users3',
      },
    ],
    public: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      maxlength: 10000,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'sessions',
      required: false,
    },
    creations: [
      {
        creation: {
          type: Schema.Types.ObjectId,
          ref: 'creations3',
          required: true,
        },
        caption: {
          type: String,
          maxlength: 1000,
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

artifactSchema.index({ user: 1, createdAt: -1 })
artifactSchema.index({ type: 1, createdAt: -1 })
artifactSchema.index({ parent: 1 })
artifactSchema.index({ session: 1 })
artifactSchema.index({ public: 1, deleted: 1, createdAt: -1 })
artifactSchema.index({ agents: 1 })

artifactSchema.plugin(paginate)
artifactSchema.plugin(aggregatePaginate)
artifactSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const ArtifactV2 = model<ArtifactV2Document>(
  'artifacts',
  artifactSchema,
) as SoftDeleteModel<ArtifactV2Document>
