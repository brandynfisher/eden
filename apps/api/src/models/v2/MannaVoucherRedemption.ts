import { MannaVoucherDocument } from '../MannaVoucher'
import { UserDocument } from '../User'
import { Document, Schema, model } from 'mongoose'

export interface MannaVoucherRedemptionSchema {
  voucher: MannaVoucherDocument
  user: UserDocument
  code: string
  createdAt?: Date
  updatedAt?: Date
}

export interface MannaVoucherRedemptionDocument
  extends MannaVoucherRedemptionSchema,
    Document {}

const mannaVoucherRedemption = new Schema<MannaVoucherRedemptionDocument>(
  {
    voucher: {
      type: Schema.Types.ObjectId,
      ref: 'mannavouchers',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    code: {
      type: String,
      required: true,
      maxlength: 42,
    },
  },
  {
    timestamps: true,
  },
)

mannaVoucherRedemption.index({ voucher: 1, user: 1 }, { unique: true })
mannaVoucherRedemption.index({ code: 1 })
mannaVoucherRedemption.index({ user: 1, createdAt: -1 })

export const MannaVoucherRedemption = model<MannaVoucherRedemptionDocument>(
  'mannavoucherredemptions',
  mannaVoucherRedemption,
)
