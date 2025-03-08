export interface MediaAttributes {
  mimeType: string
  width: number
  height: number
  aspectRatio: number
  duration?: number
}

export interface User {
  _id: string
  userId: string
  username: string
  userImage: string
}

export interface CollectionItem {
  _id: string
  createdAt: string
  updatedAt: string
  user: User
  requester: User[]
  task: string
  tool: string
  filename: string
  mediaAttributes: MediaAttributes
  name: string
  attributes: any
  public: boolean
  deleted: boolean
  url: string
  thumbnail: string
}
