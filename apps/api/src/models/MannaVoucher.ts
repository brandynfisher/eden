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

export interface MannaVoucherDocument extends MannaVoucherSchema, Document {}

const mannavoucher = new Schema<MannaVoucherDocument>(
  {
    allowedUserIds: {
      type: [String],
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    code: {
      type: String,
      required: true,
    },
    redeemedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      default: null,
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
