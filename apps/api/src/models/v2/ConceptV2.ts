import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface ConceptImageSchema {
  image: string
  usage_instructions: string
}

export interface ConceptV2Schema {
  name: string
  user: ObjectId
  agent?: ObjectId
  thumbnail?: string
  usage_instructions?: string
  images: ConceptImageSchema[]
  sdxl_lora?: ObjectId
  flux_lora?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface ConceptV2Input {
  name: string
  user: ObjectId
  agent?: ObjectId
  thumbnail?: string
  usage_instructions?: string
  images: ConceptImageSchema[]
  sdxl_lora?: ObjectId
  flux_lora?: ObjectId
}

export interface ConceptV2Document
  extends SoftDeleteDocument,
    ConceptV2Schema {}

const conceptImageSchema = new Schema<ConceptImageSchema>({
  image: {
    type: String,
    required: true,
  },
  usage_instructions: {
    type: String,
    required: true,
  },
})

export const conceptV2Schema = new Schema<ConceptV2Document>(
  {
    name: {
      type: String,
      required: true,
      unique: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: false,
    },
    thumbnail: {
      type: String,
      required: false,
    },
    usage_instructions: {
      type: String,
      required: false,
    },
    images: {
      type: [conceptImageSchema],
      required: true,
      validate: {
        validator: function (images: ConceptImageSchema[]) {
          return images.length <= 25 && images.length > 0
        },
        message: 'Images array must contain between 1 and 25 items',
      },
    },
    sdxl_lora: {
      type: Schema.Types.ObjectId,
      ref: 'models3',
      required: false,
    },
    flux_lora: {
      type: Schema.Types.ObjectId,
      ref: 'models3',
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

conceptV2Schema.index({ createdAt: -1 })
conceptV2Schema.index({ user: 1, deleted: 1, createdAt: -1 })
conceptV2Schema.index({ deleted: -1, createdAt: -1 })

conceptV2Schema.plugin(paginate)
conceptV2Schema.plugin(aggregatePaginate)
conceptV2Schema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const ConceptV2 = model<ConceptV2Document>(
  'concepts2',
  conceptV2Schema,
) as SoftDeleteModel<ConceptV2Document>
