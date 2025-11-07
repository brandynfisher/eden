export type Agent = {
  _id: string
  name?: string
  description?: string
  user?: {
    username?: string
  }
}

export type AgentsListResponse = {
  docs?: Agent[]
  error?: string
}
