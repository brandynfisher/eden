import { UserDocument } from '../Creator'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export enum ModelV2Mode {
  Face = 'face',
  Object = 'object',
  Style = 'style',
}

export type ModelV2Args = {
  name: string
  lora_training_urls: string[]
  sd_model_version: string
  concept_mode: ModelV2Mode
  num_train_epochs: number
  resolution: number
  seed: number
}

export interface ModelV2Schema {
  name: string
  user: UserDocument
  args: ModelV2Args
  checkpoint: string
  public: boolean
  slug: string
  thumbnail: string
  createdAt: Date
  updatedAt: Date
}

export interface ModelV2Input {
  name: string
  user: UserDocument
  args: ModelV2Args
  checkpoint: string
  public: boolean
  slug: string
  thumbnail: string
}

export interface ModelV2Document extends SoftDeleteDocument, ModelV2Schema {}

export type ModelV2 = ModelV2Schema

export const modelSchema = new Schema<ModelV2Document>(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      unique: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    args: {
      type: Schema.Types.Mixed,
      default: {},
    },
    checkpoint: {
      type: Schema.Types.String,
      required: true,
    },
    slug: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    public: {
      type: Schema.Types.String,
      default: false,
    },
    thumbnail: {
      type: Schema.Types.String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

modelSchema.index({ createdAt: -1 })
modelSchema.index({ user: 1, createdAt: -1 })
modelSchema.plugin(paginate)
modelSchema.plugin(aggregatePaginate)
modelSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const ModelV2 = model<ModelV2Document>(
  'models',
  modelSchema,
) as SoftDeleteModel<ModelV2Document>
