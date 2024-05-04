export type FileType = 'image'|'pdf'|'audio'|'video'|'other'

export type Media = {
  uri?: string
  thumbnailUri?: string
  width?: number
  height?: number,
  type: FileType
}
