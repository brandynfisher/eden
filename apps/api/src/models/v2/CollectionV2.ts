import { UserDocument } from '../Creator'
import { CreationV2Document } from './CreationV2'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface CollectionV2Schema {
  _id: string
  user: UserDocument
  name: string
  description?: string
  creations: CreationV2Document[]
  contributors?: UserDocument[]
  coverCreation?: CreationV2Document
  createdAt: Date
  updatedAt: Date
  deleted?: boolean
  public?: boolean
}

// export interface CollectionV2Input extends BaseTaskResult {
//   user: ObjectId
//   task: ObjectId
//   args: TaskV2Args
//   workflow: string
// }

export interface CollectionV2Document
  extends SoftDeleteDocument,
    CollectionV2Schema {}

export const collectionSchema = new Schema<CollectionV2Document>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 80,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    creations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'creations2',
        default: [],
      },
    ],
    contributors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: [],
      },
    ],
    coverCreation: {
      type: Schema.Types.ObjectId,
      ref: 'creations2',
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    public: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

collectionSchema.index({
  _id: -1,
  user: 1,
  public: 1,
  deleted: 1,
})
collectionSchema.plugin(paginate)
collectionSchema.plugin(aggregatePaginate)
collectionSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const CollectionV2 = model<CollectionV2Document>(
  'collections2',
  collectionSchema,
) as SoftDeleteModel<CollectionV2Document>
