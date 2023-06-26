import { Document, Schema, model } from 'mongoose'

import { UserDocument } from './Creator'

export interface MannaVoucherSchema {
  amount: number
  code: string
  used: boolean
  allowedUserIds?: string[]
  redeemedBy?: UserDocument
  createdAt?: Date
  updatedAt?: Date | number
}

export interface MannaVoucherInput {
  amount: number
  code: string
  allowedUserIds?: string[]
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
    },
    redeemedBy: {
      type: Schema.Types.ObjectId,
      ref: 'creators',
    },
  },
  {
    timestamps: true,
  },
)

mannavoucher.pre<MannaVoucherDocument>('update', function (next) {
  this.updatedAt = Date.now()

  next()
})

export const MannaVoucher = model<MannaVoucherDocument>(
  'mannavouchers',
  mannavoucher,
)
