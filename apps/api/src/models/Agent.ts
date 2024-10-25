import { UserDocument } from './Creator'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface AgentSchema {
  owner: UserDocument
  name: string
  key: string
  description?: string
  image?: string
  instructions?: string
  tools?: string[]
  discordId?: string
  createdAt: Date
  updatedAt: Date
  public?: boolean
}

export interface AgentDocument extends SoftDeleteDocument, AgentSchema {}

export const agentSchema = new Schema<AgentDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 80,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    image: {
      type: String,
      maxlength: 1000,
    },
    instructions: {
      type: String,
      maxlength: 1000,
    },
    tools: {
      type: [String],
      default: [],
    },
    discordId: {
      type: String,
      maxlength: 64,
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

agentSchema.index({
  _id: -1,
  owner: 1,
  public: 1,
  deleted: 1,
})
agentSchema.plugin(paginate)
agentSchema.plugin(aggregatePaginate)
agentSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const Agent = model<AgentDocument>(
  'agents',
  agentSchema,
) as SoftDeleteModel<AgentDocument>
