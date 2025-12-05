'use client'

import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/custom/sortable'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { getFileTypeByMimeType, uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import { FileType, MimeType } from '@/types/Media'
import { arrayMove } from '@dnd-kit/sortable'
import axios, { AxiosProgressEvent, CancelTokenSource } from 'axios'
import exifr from 'exifr'
import {
  AudioWaveform,
  FileImage,
  FolderArchive,
  GripVerticalIcon,
  UploadCloudIcon,
  Video,
  X,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

const MAX_IMAGE_PIXELS = 6000000 // 6MP
const MAX_IMAGE_WIDTH = 2560
const MAX_IMAGE_HEIGHT = 2560

interface FileUploadProgress {
  progress: number
  File: File
  source: CancelTokenSource | null
}

const ArchiveColor = {
  bgColor: 'blue-400',
  fillColor: 'text-blue-400',
  borderColor: 'border-blue-400',
}

const ImageColor = {
  bgColor: 'purple-600',
  fillColor: 'text-purple-600',
  borderColor: 'border-purple-600',
}

const AudioColor = {
  bgColor: 'yellow-400',
  fillColor: 'text-yellow-400',
  borderColor: 'border-yellow-400',
}

const VideoColor = {
  bgColor: 'green-400',
  fillColor: 'text-green-400',
  borderColor: 'border-green-400',
}

const OtherColor = {
  bgColor: 'gray-400',
  fillColor: 'text-gray-400',
  borderColor: 'border-gray-400',
}

const getFileIconAndColor = (fileType: FileType) => {
  if (fileType === `image`) {
    return {
      icon: (
        <FileImage size={40} className={`${ImageColor.fillColor} w-[72px]`} />
      ),
      color: ImageColor.bgColor,
    }
  }

  if (fileType === `audio`) {
    return {
      icon: (
        <AudioWaveform
          size={40}
          className={`${AudioColor.fillColor} w-[72px]`}
        />
      ),
      color: AudioColor.bgColor,
    }
  }

  if (fileType === `video`) {
    return {
      icon: <Video size={40} className={`${VideoColor.fillColor} w-[72px]`} />,
      color: VideoColor.bgColor,
    }
  }

  if (fileType === 'zip') {
    return {
      icon: (
        <FolderArchive
          size={40}
          className={`${ArchiveColor.fillColor} w-[72px]`}
        />
      ),
      color: ArchiveColor.bgColor,
    }
  }

  return {
    icon: (
      <FolderArchive size={40} className={`${OtherColor.fillColor} w-[72px]`} />
    ),
    color: OtherColor.bgColor,
  }
}

type SupportedFileType = {
  type: FileType
  allowedMimeTypes: MimeType[]
}

const supportedFileTypes: SupportedFileType[] = [
  {
    type: 'image',
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
  {
    type: 'video',
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'image/gif',
    ],
  },
  {
    type: 'audio',
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  },
  {
    type: 'zip',
    allowedMimeTypes: [
      'application/zip',
      'application/x-tar',
      'application/x-gzip',
    ],
  },
]

export type FileWithPreview = {
  url: string
  type: FileType
  name: string
  size?: number
  dimensions?: { width: number; height: number }
  duration?: number
}

type Props = {
  value: string | string[]
  onChange: (fileUrls: string | string[]) => void
  allowedFileTypes?: string[]
  maxFiles?: number
  allowMultiple?: boolean
  className?: string
  enableDropFromTimeline?: boolean
  draggable?: boolean // New prop to control drag reordering
}

const FileUploader = ({
  value,
  allowedFileTypes = ['image', 'video'], // default types
  maxFiles = 1,
  allowMultiple = false,
  enableDropFromTimeline = true,
  onChange,
  className,
  draggable = false, // Default to no drag reordering
}: Props) => {
  // Separate existing file URLs into an array
  const existingUrls = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value],
  )

  const [existingFiles, setExistingFiles] = useState<FileWithPreview[]>([])
  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([])
  const [showMaxError, setShowMaxError] = useState(false)

  // Initialize existingFiles based on value prop
  useEffect(() => {
    const initFiles: FileWithPreview[] = existingUrls.map(url => {
      const fileType = getFileTypeByMimeType(urlToMimeType(url)) || 'image'
      const name = url.split('/').pop() || 'file'
      return {
        url,
        type: fileType,
        name,
      }
    })

    // Prevent unnecessary state updates
    setExistingFiles(prevExistingFiles => {
      const prevUrls = prevExistingFiles.map(f => f.url)
      const newUrls = initFiles.map(f => f.url)
      const isSame =
        prevUrls.length === newUrls.length &&
        prevUrls.every((url, index) => url === newUrls[index])

      if (isSame) {
        return prevExistingFiles
      }

      return initFiles
    })
  }, [existingUrls])

  // Helper function to extract MIME type from URL
  const urlToMimeType = (url: string): MimeType => {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'png':
        return 'image/png'
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'webp':
        return 'image/webp'
      case 'mp4':
        return 'video/mp4'
      case 'webm':
        return 'video/webm'
      case 'mov':
        return 'video/quicktime'
      case 'gif':
        return 'image/gif'
      case 'zip':
        return 'application/zip'
      case 'tar':
        return 'application/x-tar'
      case 'gz':
      case 'tgz':
        return 'application/x-gzip'
      case 'mp3':
        return 'audio/mpeg'
      case 'wav':
        return 'audio/wav'
      case 'ogg':
        return 'audio/ogg'
      default:
        return 'image/jpeg'
    }
  }

  // Handle file upload progress and completion
  const onUploadProgressHandler = (
    progressEvent: AxiosProgressEvent,
    file: File,
    cancelSource: CancelTokenSource,
  ) => {
    const progress = Math.round(
      (progressEvent.loaded / (progressEvent.total ?? 0)) * 100,
    )

    if (progress === 100) {
      return
    }

    setFilesToUpload(prev =>
      prev.map(item =>
        item.File === file ? { ...item, progress, source: cancelSource } : item,
      ),
    )
  }

  // Add EXIF rotation function here too
  const rotateImageBasedOnExif = async (file: File): Promise<File> => {
    // Only process image files
    if (!file.type.startsWith('image/')) {
      return file
    }

    // In React Native WebView / environments without DOM imaging APIs,
    // skip client-side rotation to avoid runtime errors.
    if (typeof document === 'undefined') {
      return file
    }

    try {
      // Read EXIF data
      const exifData = await exifr.parse(file)
      const orientation = exifData?.Orientation || 1

      // Create canvas to rotate and resize image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return file
      }

      // Create image element
      const img = new Image()
      const imageUrl = URL.createObjectURL(file)

      return new Promise(resolve => {
        img.onload = () => {
          let { width, height } = img

          // Calculate new dimensions based on orientation first
          let displayWidth = width
          let displayHeight = height

          if (orientation >= 5 && orientation <= 8) {
            // For orientations 5-8, swap width and height for display
            displayWidth = height
            displayHeight = width
          }

          // Check if image needs resizing (6MP = 6,000,000 pixels or width/height > 2560)
          const currentPixels = displayWidth * displayHeight

          let needsResize = false
          let scaleRatio = 1

          if (
            currentPixels > MAX_IMAGE_PIXELS ||
            displayWidth > MAX_IMAGE_WIDTH ||
            displayHeight > MAX_IMAGE_HEIGHT
          ) {
            needsResize = true

            // Calculate scale ratio based on whichever constraint is more restrictive
            const pixelRatio = Math.sqrt(MAX_IMAGE_PIXELS / currentPixels)
            const widthRatio = MAX_IMAGE_WIDTH / displayWidth
            const heightRatio = MAX_IMAGE_HEIGHT / displayHeight

            scaleRatio = Math.min(pixelRatio, widthRatio, heightRatio)
          }

          // Apply scaling to display dimensions
          if (needsResize) {
            displayWidth = Math.round(displayWidth * scaleRatio)
            displayHeight = Math.round(displayHeight * scaleRatio)
          }

          // Set canvas size based on final display dimensions
          canvas.width = displayWidth
          canvas.height = displayHeight

          // Apply rotation based on EXIF orientation
          if (orientation !== 1) {
            switch (orientation) {
              case 2:
                // Flip horizontal
                ctx.scale(-1, 1)
                ctx.translate(-displayWidth, 0)
                break
              case 3:
                // Rotate 180°
                ctx.translate(displayWidth, displayHeight)
                ctx.rotate(Math.PI)
                break
              case 4:
                // Flip vertical
                ctx.scale(1, -1)
                ctx.translate(0, -displayHeight)
                break
              case 5:
                // Flip horizontal + rotate 90° CCW
                ctx.rotate(-Math.PI / 2)
                ctx.scale(-1, 1)
                ctx.translate(-displayWidth, -displayHeight)
                break
              case 6:
                // Rotate 90° CW
                ctx.rotate(Math.PI / 2)
                ctx.translate(0, -displayHeight)
                break
              case 7:
                // Flip horizontal + rotate 90° CW
                ctx.rotate(Math.PI / 2)
                ctx.scale(-1, 1)
                ctx.translate(-displayWidth, 0)
                break
              case 8:
                // Rotate 90° CCW
                ctx.rotate(-Math.PI / 2)
                ctx.translate(-displayWidth, 0)
                break
            }
          }

          // Draw the image (resized and/or rotated)
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

          // Convert canvas to blob and create new file
          canvas.toBlob(
            blob => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: file.lastModified,
                })
                resolve(processedFile)
              } else {
                resolve(file)
              }
            },
            file.type,
            0.95,
          ) // 95% quality

          URL.revokeObjectURL(imageUrl)
        }

        img.onerror = () => {
          URL.revokeObjectURL(imageUrl)
          resolve(file) // Return original file on error
        }

        img.src = imageUrl
      })
    } catch (error) {
      console.warn('Failed to process image:', error)
      return file // Return original file on error
    }
  }

  const uploadAsset = async (
    file: File,
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
    cancelSource: CancelTokenSource,
  ) => {
    try {
      // Auto-rotate image based on EXIF data before upload
      const processedFile = await rotateImageBasedOnExif(file)

      return uploadFileToS3({
        file: processedFile,
        onUploadProgress,
        cancelSource,
      })
    } catch (e) {
      console.error(e)
      toast.error(`Failed to upload file!`, {
        description: file.name,
        dismissible: true,
        richColors: true,
      })
    }
  }

  const removeFile = (url: string) => {
    setExistingFiles(prev => prev.filter(file => file.url !== url))
    const updatedUrls = existingFiles
      .filter(file => file.url !== url)
      .map(file => file.url)
    onChange(maxFiles === 1 ? updatedUrls[0] : updatedUrls)
  }

  const cancelUpload = (file: File) => {
    const fileProgress = filesToUpload.find(item => item.File === file)
    if (fileProgress?.source) {
      fileProgress.source.cancel('Upload cancelled')
    }
    setFilesToUpload(prev => prev.filter(item => item.File !== file))
  }

  const verifyFileTypes = (acceptedFiles: File[]) => {
    const acceptedFilesWithType = acceptedFiles.filter(file => {
      const mimeType = file.type ?? urlToMimeType(file.name)
      const fileType = getFileTypeByMimeType(mimeType)
      return allowedFileTypes.some(type => type === fileType)
    })

    if (acceptedFilesWithType.length !== acceptedFiles.length) {
      toast.error(`Unsupported file type!`, {
        description: `Only ${allowedFileTypes
          .map(type => type)
          .join(', ')} files are supported`,
        dismissible: true,
        richColors: true,
      })
      return false
    }
    return true
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      if (!maxFiles || maxFiles === 1) {
        // If maxFiles is 1, replace the existing file with the new one
        setFilesToUpload([])
        setExistingFiles([])
      } else if (
        existingFiles.length + filesToUpload.length + acceptedFiles.length >
        maxFiles
      ) {
        setShowMaxError(true)
        setTimeout(() => setShowMaxError(false), 3000) // Hide error after 3 seconds
        return
      }

      const newUploads: FileUploadProgress[] = acceptedFiles.map(file => ({
        progress: 0,
        File: file,
        source: null,
      }))

      setFilesToUpload(prev => [...prev, ...newUploads])

      // Array to collect successfully uploaded file URLs
      const uploadedFileUrls: string[] = []

      // Start uploading
      const uploadPromises = acceptedFiles.map(async file => {
        const cancelSource = axios.CancelToken.source()
        const asset = await uploadAsset(
          file,
          progressEvent =>
            onUploadProgressHandler(progressEvent, file, cancelSource),
          cancelSource,
        )

        if (asset?.fileUrl) {
          setExistingFiles(prev => [
            ...prev,
            {
              ...asset,
              url: asset.fileUrl,
              type: getFileTypeByMimeType(asset.type as MimeType) || 'image',
              name: file.name,
              size: file.size,
            },
          ])

          // Collect the uploaded file URL
          uploadedFileUrls.push(asset.fileUrl)
        }

        setFilesToUpload(prev => prev.filter(item => item.File !== file))
      })

      try {
        await Promise.all(uploadPromises)

        // After all uploads, call onChange once with the updated URLs
        const allUrls = [...existingFiles.map(f => f.url), ...uploadedFileUrls]
        onChange(
          maxFiles === 1
            ? uploadedFileUrls[uploadedFileUrls.length - 1]
            : allUrls,
        )

        toast.info(`Upload finished`, {
          description: `${acceptedFiles.length} File${
            acceptedFiles.length > 1 ? 's' : ''
          }`,
          dismissible: true,
          richColors: true,
        })
      } catch (error) {
        const debugInfo = axios.isAxiosError(error)
          ? {
              message: error.message,
              status: error.response?.status,
              statusText: error.response?.statusText,
              responseData: error.response?.data,
              responseText: error.request?.responseText,
              requestUrl: error.config?.url,
            }
          : { message: (error as Error)?.message || String(error) }

        console.error('Error uploading files', debugInfo, error)

        toast.error('Error while uploading files', {
          description:
            debugInfo.message ||
            (axios.isAxiosError(error) ? 'Axios error' : 'Unknown error'),
          dismissible: true,
          richColors: true,
        })
      }
    },
    [existingFiles, filesToUpload, maxFiles, onChange],
  )

  const acceptedFiles: Record<string, string[]> = useMemo(() => {
    return supportedFileTypes
      .filter(type => allowedFileTypes?.includes(type.type))
      .reduce(
        (acc, type) => ({
          ...acc,
          ...type.allowedMimeTypes.reduce((a, m) => ({ ...a, [m]: [] }), {}),
        }),
        {},
      )
  }, [allowedFileTypes])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: allowMultiple,
    maxFiles: allowMultiple ? maxFiles : 1,
    accept: acceptedFiles,
  })

  const handleMove = (activeIndex: number, overIndex: number) => {
    const newExistingFiles = arrayMove(existingFiles, activeIndex, overIndex)
    setExistingFiles(newExistingFiles)
    const newUrls = newExistingFiles.map(file => file.url)
    onChange(maxFiles === 1 ? newUrls[0] : newUrls)
  }

  const handleDropFromTimeline = (e: React.DragEvent<HTMLDivElement>) => {
    if (!enableDropFromTimeline) return

    const url = e.dataTransfer.getData('text/plain')
    if (!url) return
    if (existingFiles.find(f => f.url === url)) return

    const mimeType = urlToMimeType(url)
    if (!acceptedFiles[mimeType]) return

    setExistingFiles(prev => [
      ...prev,
      {
        url,
        type: getFileTypeByMimeType(mimeType),
        name: url.split('/').pop() || 'file',
      },
    ])
    onChange(maxFiles === 1 ? url : [...existingFiles.map(f => f.url), url])
  }

  return (
    <div className={cn(['flex flex-col gap-3', className])}>
      {/* Drag & Drop Area - only show when under limit */}
      {existingFiles.length + filesToUpload.length < (maxFiles || 1) && (
        <div
          {...getRootProps()}
          onDrop={e => {
            e.preventDefault()
            if (e.dataTransfer.getData('text/plain')) {
              handleDropFromTimeline(e)
            } else {
              const files = Array.from(e.dataTransfer.files)
              if (!verifyFileTypes(files)) return
              onDrop(files)
            }
          }}
          className={cn([
            'border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors',
            'hover:border-primary/50 hover:bg-accent/50',
            isDragActive && 'border-primary bg-accent',
          ])}
        >
          <UploadCloudIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <div className="text-sm font-medium text-foreground mb-1">
            {maxFiles === 1 ? 'Upload an' : `Upload up to ${maxFiles}`}{' '}
            {allowedFileTypes?.join(' or ')}
            {maxFiles === 1 ? '' : 's'}
          </div>
          <div className="text-xs text-muted-foreground">
            Click here or drag and drop files
          </div>

          <Input
            {...getInputProps()}
            id="dropzone-file"
            accept={supportedFileTypes
              .filter(type => allowedFileTypes?.includes(type.type))
              .flatMap(type => type.allowedMimeTypes)
              .join(', ')}
            type="file"
            className="hidden"
          />
        </div>
      )}

      {/* Error message for too many files */}
      {showMaxError && (
        <div className="text-center text-sm text-red-500">
          Maximum {maxFiles} files allowed
        </div>
      )}

      {/* Thumbnails Grid */}
      {(existingFiles.length > 0 || filesToUpload.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {/* Existing Files */}
          {draggable && existingFiles.length > 1 ? (
            <Sortable
              value={existingFiles.map(file => ({ id: file.url }))}
              onMove={({ activeIndex, overIndex }) =>
                handleMove(activeIndex, overIndex)
              }
            >
              {existingFiles.map(file => (
                <SortableItem key={file.url} value={file.url} asChild>
                  <div className="relative">
                    <FileCard
                      file={file}
                      onRemove={() => removeFile(file.url)}
                      showDragHandle={draggable}
                    />
                  </div>
                </SortableItem>
              ))}
            </Sortable>
          ) : (
            <>
              {existingFiles.map(file => (
                <FileCard
                  key={file.url}
                  file={file}
                  onRemove={() => removeFile(file.url)}
                  showDragHandle={false}
                />
              ))}
            </>
          )}

          {/* Uploading Files */}
          {filesToUpload.map((fileProgress, index) => (
            <UploadingFileCard
              key={index}
              fileProgress={fileProgress}
              onCancel={() => cancelUpload(fileProgress.File)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// FileCard Component
const FileCard = ({
  file,
  onRemove,
  showDragHandle,
}: {
  file: FileWithPreview
  onRemove: () => void
  showDragHandle: boolean
}) => {
  return (
    <div className="relative w-32 h-32 bg-card border rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
      {/* Drag Handle */}
      {showDragHandle && (
        <SortableDragHandle className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVerticalIcon className="h-3 w-3" />
        </SortableDragHandle>
      )}

      {/* Remove Button */}
      <button
        onClick={e => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute top-1 right-1 z-10 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
      >
        <X className="h-3 w-3" />
      </button>

      {/* File Preview */}
      {file.type === 'image' ? (
        <img
          src={file.url}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      ) : file.type === 'video' ? (
        <video
          src={file.url}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`text-${
              getFileIconAndColor(getFileTypeByMimeType(file.type)).color
            }`}
          >
            {getFileIconAndColor(getFileTypeByMimeType(file.type)).icon}
          </div>
        </div>
      )}
    </div>
  )
}

// UploadingFileCard Component
const UploadingFileCard = ({
  fileProgress,
  onCancel,
}: {
  fileProgress: FileUploadProgress
  onCancel: () => void
}) => {
  return (
    <div className="relative w-32 h-32 bg-card border rounded-lg overflow-hidden">
      {/* Cancel Button */}
      <button
        onClick={e => {
          e.stopPropagation()
          onCancel()
        }}
        className="absolute top-1 right-1 z-10 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90"
      >
        <X className="h-3 w-3" />
      </button>

      {/* File Preview or Icon */}
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div
          className={`text-${
            getFileIconAndColor(
              getFileTypeByMimeType(fileProgress.File.type as MimeType),
            ).color
          }`}
        >
          {
            getFileIconAndColor(
              getFileTypeByMimeType(fileProgress.File.type as MimeType),
            ).icon
          }
        </div>
      </div>

      {/* Progress Overlay */}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xs font-medium">{fileProgress.progress}%</div>
          <Progress value={fileProgress.progress} className="w-12 h-1 mt-1" />
        </div>
      </div>
    </div>
  )
}

export default FileUploader
