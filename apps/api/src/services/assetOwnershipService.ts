import { Types } from 'mongoose'

type ObjectIdLike = Types.ObjectId | string | null | undefined

const resolveId = (
  edenUserId?: ObjectIdLike,
  fallbackId?: ObjectIdLike,
): ObjectIdLike => {
  if (edenUserId) {
    return edenUserId
  }
  if (fallbackId) {
    return fallbackId
  }
  return null
}

export const resolveTaskOwnerId = (task: {
  eden_user_id?: ObjectIdLike
  user?: ObjectIdLike
}) => {
  return resolveId(task.eden_user_id, task.user)
}

export const resolveCreationOwnerId = (creation: {
  eden_user_id?: ObjectIdLike
  user?: ObjectIdLike
}) => {
  return resolveId(creation.eden_user_id, creation.user)
}

export const resolveMessageOwnerId = (message: {
  eden_user_id?: ObjectIdLike
  sender?: ObjectIdLike
}) => {
  return resolveId(message.eden_user_id, message.sender)
}
