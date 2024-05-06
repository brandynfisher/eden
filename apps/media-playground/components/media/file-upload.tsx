'use client'

import axios, { AxiosProgressEvent, CancelTokenSource } from 'axios'
import { AudioWaveform, File as FileIcon, FileImage, FolderArchive, UploadCloud, Video, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { FileType, MimeType } from '@/types/Media'
import { CONFIG } from '@/lib/config'

interface FileUploadProgress {
  progress: number;
  File: File;
  source: CancelTokenSource | null;
}

const ImageColor = {
  bgColor: 'bg-purple-600',
  fillColor: 'fill-purple-600',
  borderColor: 'border-purple-600',
}

const PdfColor = {
  bgColor: 'bg-blue-400',
  fillColor: 'fill-blue-400',
  borderColor: 'border-blue-400',
}

const AudioColor = {
  bgColor: 'bg-yellow-400',
  fillColor: 'fill-yellow-400',
  borderColor: 'border-yellow-400',
}

const VideoColor = {
  bgColor: 'bg-green-400',
  fillColor: 'fill-green-400',
  borderColor: 'border-green-400',
}

const OtherColor = {
  bgColor: 'bg-gray-400',
  fillColor: 'fill-gray-400',
  borderColor: 'border-gray-400',
}

const getFileIconAndColor = (fileType: FileType) => {
  console.log({ fileType })
  if (fileType === `image`) {
    return {
      icon: <FileImage size={40} className={ImageColor.fillColor} />,
      color: ImageColor.bgColor,
    }
  }

  if (fileType === `pdf`) {
    return {
      icon: <FileIcon size={40} className={PdfColor.fillColor} />,
      color: PdfColor.bgColor,
    }
  }

  if (fileType === `audio`) {
    return {
      icon: <AudioWaveform size={40} className={AudioColor.fillColor} />,
      color: AudioColor.bgColor,
    }
  }

  if (fileType === `video`) {
    return {
      icon: <Video size={40} className={VideoColor.fillColor} />,
      color: VideoColor.bgColor,
    }
  }

  return {
    icon: <FolderArchive size={40} className={OtherColor.fillColor} />,
    color: OtherColor.bgColor,
  }
}

type Props = {
  allowedFileTypes?: FileType[]
}
type SupportedFileType = {
  type: FileType,
  allowedMimeTypes: MimeType[]
}

const supportedFileTypes: SupportedFileType[] = [
  {
    type: 'image',
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
  {
    type: 'video',
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'image/gif'],
  },
]

const getTypeByMimeType = (mimeType: MimeType) => {
  return mimeType.split('/')[0] as FileType
}

const FileUpload = ({ allowedFileTypes }: Props) => {
  // const [uploadedFiles, setUploadedFiles] = useState<File[]>([{ type: FileTypes.Image, lastModified: Date.now(), name: 'imagefile.png' }])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([])

  const allowedTypes = supportedFileTypes.filter(item => allowedFileTypes?.includes(item.type))
  const allowedFileMimeTypes = allowedTypes.map(type => type.allowedMimeTypes)
  const fixedColorClassName = allowedTypes && allowedTypes.length === 1 ? getFileIconAndColor(allowedTypes[0].type).color : undefined

  console.log({ allowedTypes, fixedColorClassName, uploadedFiles, filesToUpload })

  // feel free to mode all these functions to separate utils
  // here is just for simplicity
  const onUploadProgress = (
    progressEvent: AxiosProgressEvent,
    file: File,
    cancelSource: CancelTokenSource,
  ) => {
    const progress = Math.round(
      (progressEvent.loaded / (progressEvent.total ?? 0)) * 100,
    )

    if (progress === 100) {
      setUploadedFiles((prevUploadedFiles) => {
        return [...prevUploadedFiles, file]
      })

      setFilesToUpload((prevUploadProgress) => {
        return prevUploadProgress.filter((item) => item.File !== file)
      })

      return
    }

    setFilesToUpload((prevUploadProgress) => {
      return prevUploadProgress.map((item) => {
        if (item.File.name === file.name) {
          return {
            ...item,
            progress,
            source: cancelSource,
          }
        } else {
          return item
        }
      })
    })
  }

  const uploadImageToCloudinary = async (
    formData: FormData,
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
    cancelSource: CancelTokenSource,
  ) => {
    return axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      {
        onUploadProgress,
        cancelToken: cancelSource.token,
      },
    )
  }

  const removeFile = (file: File) => {
    setFilesToUpload((prevUploadProgress) => {
      return prevUploadProgress.filter((item) => item.File !== file)
    })

    setUploadedFiles((prevUploadedFiles) => {
      return prevUploadedFiles.filter((item) => item !== file)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setFilesToUpload((prevUploadProgress) => {
      return [
        ...prevUploadProgress,
        ...acceptedFiles.map((file) => {
          return {
            progress: 0,
            File: file,
            source: null,
          }
        }),
      ]
    })

    // cloudinary upload
    const fileUploadBatch = acceptedFiles.map((file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'upload_preset',
        CONFIG.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string,
      )

      const cancelSource = axios.CancelToken.source()
      return uploadImageToCloudinary(
        formData,
        (progressEvent) => onUploadProgress(progressEvent, file, cancelSource),
        cancelSource,
      )
    })

    try {
      await Promise.all(fileUploadBatch)
      alert('All files uploaded successfully')
    } catch (error) {
      console.error('Error uploading files: ', error)
    }
  }, [])

  // const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: allowedFileMimeTypes.map(item => ) })
  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: {
      'image/jpg': [],
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    } })

  return (
    <div className='flex-grow'>
      <div>
        <label
          {...getRootProps()}
          className={cn('relative flex flex-col items-center justify-center w-full py-6 border rounded-lg cursor-pointer bg-card', `border-${fixedColorClassName}`)}
        >
          <div className='text-center'>
            <div className=' border p-2 rounded-md max-w-min mx-auto'>
              <UploadCloud size={20} />
            </div>

            <p className='mt-2 text-sm text-muted-foreground'>
              <span className='font-semibold'>Drag files</span>
            </p>
            <p className='text-xs text-muted-foreground'>
              Click to upload files &#40;files should be under 10 MB &#41;
            </p>
            <p className='text-xs text-muted-foreground'>
              {allowedFileTypes?.join(', ')} | ({allowedFileMimeTypes.join(', ')})
            </p>
          </div>
        </label>

        <Input
          {...getInputProps()}
          id='dropzone-file'
          accept={allowedFileMimeTypes.join(', ')}
          type='file'
          className='hidden'
        />
      </div>

      {filesToUpload.length > 0 && (
        <ScrollArea className='h-40'>
          <p className='font-medium my-2 mt-4 text-muted-foreground text-sm'>
            Uploading...
          </p>
          <div className='bg-card space-y-2'>
            {filesToUpload.map((fileUploadProgress) => {
              return (
                <div
                  key={fileUploadProgress.File.lastModified}
                  className='flex justify-between gap-2 rounded-lg overflow-hidden border border-border group'
                >
                  <div className='flex items-center flex-1 p-2'>
                    <div className='text-white'>
                      {getFileIconAndColor(getTypeByMimeType(fileUploadProgress.File.type as MimeType)).icon}
                    </div>

                    <div className='w-full ml-2 space-y-1'>
                      <div className='text-xs flex justify-between'>
                        <p className='text-muted-foreground'>
                          {fileUploadProgress.File.name.slice(0, 25)}
                        </p>
                        <span>
                          {fileUploadProgress.progress}%
                        </span>
                      </div>
                      <Progress
                        value={fileUploadProgress.progress}
                        className={
                          getFileIconAndColor(getTypeByMimeType(fileUploadProgress.File.type as MimeType)).color
                        }
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (fileUploadProgress.source)
                        fileUploadProgress.source.cancel('Upload cancelled')
                      removeFile(fileUploadProgress.File)
                    }}
                    className='bg-destructive text-destructive-foreground transition-all items-center justify-center cursor-pointer px-2 hidden group-hover:flex'
                  >
                    <X size={20} />
                  </button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {uploadedFiles.length > 0 && (
        <div className='bg-card'>
          <p className='font-medium my-2 mt-6 text-muted-foreground text-sm'>
            Uploaded Files
          </p>
          <div className='space-y-2 pr-3'>
            {uploadedFiles.map((file) => {
              return (
                <div
                  key={file.lastModified}
                  className='flex justify-between gap-2 rounded-lg overflow-hidden border border-border group hover:pr-0 pr-2 hover:border-border transition-all'
                >
                  <div className='flex items-center flex-1 p-2'>
                    <div className='text-white'>
                      {getFileIconAndColor(getTypeByMimeType(file.type as MimeType)).icon}
                    </div>
                    <div className='w-full ml-2 space-y-1'>
                      <div className='text-sm flex justify-between'>
                        <p className='text-muted-foreground'>
                          {file.name.slice(0, 25)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file)}
                    className='bg-destructive text-destructive-foreground transition-all items-center justify-center px-2 hidden group-hover:flex'
                  >
                    <X size={20} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload