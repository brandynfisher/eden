export type FileType = 'image'|'pdf'|'audio'|'video'|'other'
export type MimeTypesVideo = 'video/mp4'|'video/webm'|'video/quicktime'|'image/gif'
export type MimeTypesImage = 'image/png'|'image/webp'|'image/jpg'|'image/jpeg'

export type MimeType = MimeTypesVideo | MimeTypesImage

interface Media {
  uri?: string
  thumbnailUri?: string
  width?: number
  height?: number,
  type: FileType
  mimeType?: MimeType
}

interface MediaVideo extends Media {
  type: 'video',
  mimeType: MimeTypesVideo
}

interface MediaImage extends Media {
  type: 'image',
  mimeType: MimeTypesImage
}