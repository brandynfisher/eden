import mongoose, { ObjectId } from 'mongoose'

import { FeatureFlag, UserDocument } from '../models/Creator'

export type IdInput = string | ObjectId

export const enforceUserDocumentLimit = async (
  limit: number,
  modelName: string,
  creatorDoc: UserDocument,
) => {
  const creator = await mongoose.model('users').findById(creatorDoc)
  if (creator) {
    const count = await mongoose
      .model(modelName)
      .countDocuments({ user: creator._id })
    if (count >= limit) {
      throw new Error(
        `Maximum number of ${modelName} reached for this creator.`,
      )
    }
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
