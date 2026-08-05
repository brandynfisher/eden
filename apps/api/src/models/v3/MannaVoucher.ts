import { UserDocument } from '../User'
import { Document, Schema, model } from 'mongoose'

export interface MannaVoucherSchema {
  amount: number
  code: string
  used: boolean
  allowedUserIds?: string[]
  redeemedBy?: UserDocument
  action?: string
  maxUses?: number
  usedCount?: number
  expiresAt?: Date
  createdAt?: Date
  updatedAt?: Date | number
}

export interface MannaVoucherInput {
  amount: number
  code: string
  allowedUserIds?: string[]
  action?: string
  maxUses?: number
  usedCount?: number
  expiresAt?: Date
}

export enum VoucherAction {
  AddManna = 'manna',
  GrantEden2Access = 'eden2_access',
  SubscriptionTrialPro30d = 'subscription_trial_pro_30d',
  MarsCollege26 = 'mars_college_26',
}

export interface MannaVoucherDocument extends MannaVoucherSchema, Document {}

const mannavoucher = new Schema<MannaVoucherDocument>(
  {
    amount: {
      type: Number,
      required: true,
    },
    code: {
      type: String,
      required: true,
      maxlength: 42,
    },
    used: {
      type: Boolean,
      default: false,
    },
    allowedUserIds: {
      type: [String],
      // Mongoose defaults array paths to `[]`, which is indistinguishable from
      // an allow list that intentionally names nobody. Leaving the path unset
      // keeps the three states distinct: absent = unrestricted, [] = nobody,
      // populated = those users. The redeem check is fail-closed on [].
      default: undefined,
    },
    redeemedBy: {
      type: Schema.Types.ObjectId,
      ref: 'creators',
    },
    action: {
      type: String,
      enum: Object.values(VoucherAction),
    },
    maxUses: {
      type: Number,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

mannavoucher.pre<MannaVoucherDocument>('save', function (next) {
  this.updatedAt = Date.now()

  next()
})

mannavoucher.index(
  { code: 1, used: 1 },
  { collation: { locale: 'en', strength: 2 } },
)
mannavoucher.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const MannaVoucher = model<MannaVoucherDocument>(
  'mannavouchers',
  mannavoucher,
)
