import { ErrorResponseSchema } from './common'
import { Type } from '@sinclair/typebox'

export const MannaVoucherRedeemRequestSchema = Type.Object({
  code: Type.String(),
})

export const MannaVoucherRedeemResponseSchema = Type.Object({
  action: Type.String(),
  success: Type.Optional(Type.Boolean()),
  manna: Type.Optional(Type.Number()),
  subscriptionBalance: Type.Optional(Type.Number()),
  topupAmount: Type.Optional(Type.Number()),
  transactionId: Type.Optional(Type.String()),
})

export const MannaV3Domain = {
  request: {
    redeemVoucher: MannaVoucherRedeemRequestSchema,
  },
  response: {
    redeemVoucher: MannaVoucherRedeemResponseSchema,
    error: ErrorResponseSchema,
  },
}
