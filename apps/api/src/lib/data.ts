import mongoose, { ObjectId } from 'mongoose'

import { UserDocument } from '../models/Creator'

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
