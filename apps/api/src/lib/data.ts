import { UserDocument } from '../models/Creator'
import { FeatureFlag } from '@edenlabs/eden-sdk'
import mongoose from 'mongoose'

export const enforceUserDocumentLimit = async (
  limit: number,
  modelName: string,
  userId: string,
) => {
  const creator = await mongoose.model('users').findById(userId)
  if (creator) {
    const count = await mongoose
      .model(modelName)
      .countDocuments({ user: creator._id })

    return count < limit
  }
}

export const checkUserFlags = async (
  user: UserDocument,
  flag: FeatureFlag,
): Promise<boolean> => {
  if (!user.featureFlags) {
    return false
  }

  return user.featureFlags.includes(flag)
}
