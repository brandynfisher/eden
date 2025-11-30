import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface VerdelisSeedV2Schema {
  title: string
  logline: string
  images: string[]
  agents: ObjectId[]
  createdAt: Date
  updatedAt: Date
  deleted?: boolean
}

export interface VerdelisSeedV2Input {
  title: string
  logline: string
  images: string[]
  agents?: ObjectId[]
}

export interface VerdelisSeedV2Document
  extends SoftDeleteDocument,
    VerdelisSeedV2Schema {}

export const verdelisSeedSchema = new Schema<VerdelisSeedV2Document>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 500,
    },
    logline: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    agents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users3',
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

verdelisSeedSchema.index({ createdAt: -1 })
verdelisSeedSchema.index({ agents: 1 })
verdelisSeedSchema.index({ deleted: 1, createdAt: -1 })

verdelisSeedSchema.plugin(paginate)
verdelisSeedSchema.plugin(aggregatePaginate)
verdelisSeedSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const VerdelisSeedV2 = model<VerdelisSeedV2Document>(
  'verdelis_seeds',
  verdelisSeedSchema,
) as SoftDeleteModel<VerdelisSeedV2Document>
