export interface OpenGraphVideo {
  url: string
  type: string
  width?: number
  height?: number
  secureUrl?: string
}

export interface OpenGraph {
  type?: string
  title?: string
  description?: string
  images?: string[]
  videos?: OpenGraphVideo[]
}
