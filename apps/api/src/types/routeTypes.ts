import { Type } from '@sinclair/typebox'

export const configType = Type.Record(Type.String(), Type.Any())
export const argsType = Type.Record(Type.String(), Type.Any())
export const parameterType = Type.Array(Type.Record(Type.String(), Type.Any()))

export const conceptDocType = Type.Object({
  deleted: Type.Boolean(),
  isPrivate: Type.Boolean(),
  _id: Type.String(),
  user: Type.String(),
  praiseCount: Type.Number(),
  bookmarkCount: Type.Number(),
  thumbnail: Type.String(),
  name: Type.String(),
  conceptName: Type.String(),
  checkpoint: Type.String(),
  training_images: Type.Array(Type.String()),
  instance_prompt: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  __v: Type.Number(),
  creationCount: Type.Number(),
  publicName: Type.String(),
})

export const conceptType = Type.Object({
  concept: Type.Object({
    deleted: Type.Boolean(),
    isPrivate: Type.Boolean(),
    _id: Type.String(),
    user: Type.Object({
      _id: Type.String(),
      userId: Type.String(),
      username: Type.String(),
      userImage: Type.String(),
    }),
    praiseCount: Type.Number(),
    bookmarkCount: Type.Number(),
    uri: Type.String(),
    thumbnail: Type.String(),
    name: Type.String(),
    conceptName: Type.String(),
    checkpoint: Type.String(),
    training_images: Type.Array(Type.String()),
    instance_prompt: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    __v: Type.Number(),
    creationCount: Type.Number(),
  }),
})

export const sessionType = Type.Object({
  id: Type.String(),
  user: Type.String(),
  users: Type.Array(Type.Any()),
  characters: Type.Array(Type.Any()),
})
