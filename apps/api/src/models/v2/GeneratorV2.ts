import {
  BaseModelName,
  GeneratorOutputTypeV2,
  GeneratorParameterV2,
} from '@edenlabs/eden-sdk'
import { Schema, model } from 'mongoose'

export type GeneratorV2Schema = {
  key: string
  name: string
  description?: string
  private?: boolean
  parameters?: GeneratorParameterV2[]
  outputType: GeneratorOutputTypeV2
  costEstimate?: string
  resolutions?: string[]
  thumbnail?: string
  order?: number
  baseModel?: BaseModelName
}

export interface GeneratorV2Document extends GeneratorV2Schema {}

export const generatorV2Schema = new Schema<GeneratorV2Document>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    private: {
      type: Boolean,
    },
    parameters: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    outputType: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    resolutions: {
      type: [String],
    },
    order: {
      type: Number,
    },
    baseModel: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

generatorV2Schema.index({ createdAt: -1 })
generatorV2Schema.index({ outputType: -1, createdAt: -1 })
generatorV2Schema.index({ key: -1, private: -1, createdAt: -1 })

export const GeneratorV2 = model<GeneratorV2Document>(
  'tools',
  generatorV2Schema,
)
