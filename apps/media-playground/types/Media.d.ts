export type FileType = 'image' | 'pdf' | 'audio' | 'video' | 'archive' | 'other'
export type MimeTypesVideo =
  | 'video/mp4'
  | 'video/webm'
  | 'video/quicktime'
  | 'image/gif'
export type MimeTypesImage =
  | 'image/png'
  | 'image/webp'
  | 'image/jpg'
  | 'image/jpeg'
export type MimeTypesArchive =
  | 'application/zip'
  | 'application/x-tar'
  | 'application/x-gzip'

export type MimeType = MimeTypesVideo | MimeTypesImage | MimeTypesArchive

interface Media {
  url?: string
  thumbnail?: string
  width?: number
  height?: number
  type: FileType
  mimeType?: MimeType
  blur?: string
}

interface MediaVideo extends Media {
  type: 'video'
  mimeType: MimeTypesVideo
}

interface MediaImage extends Media {
  type: 'image'
  mimeType: MimeTypesImage
}
