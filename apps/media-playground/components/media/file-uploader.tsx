'use client'

import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { FileType, MimeType } from '@/types/Media'
import axios, { AxiosProgressEvent, CancelTokenSource } from 'axios'
import {
  AudioWaveform,
  FileImage,
  FolderArchive,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploadProgress {
  progress: number
  File: File
  source: CancelTokenSource | null
}

const ImageColor = {
  bgColor: 'purple-600',
  fillColor: 'purple-600',
  borderColor: 'purple-600',
}

const AudioColor = {
  bgColor: 'yellow-400',
  fillColor: 'yellow-400',
  borderColor: 'yellow-400',
}

const VideoColor = {
  bgColor: 'green-400',
  fillColor: 'green-400',
  borderColor: 'green-400',
}

const OtherColor = {
  bgColor: 'gray-400',
  fillColor: 'gray-400',
  borderColor: 'gray-400',
}

const getFileIconAndColor = (fileType: FileType) => {
  // console.log({ fileType })
  if (fileType === `image`) {
    return {
      icon: <FileImage size={40} className={ImageColor.fillColor} />,
      color: ImageColor.bgColor,
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
]

const getTypeByMimeType = (mimeType: MimeType) => {
  return mimeType.split('/')[0] as FileType
}

type FileWithPreview = File & {
  preview?: string
}

const FileUploader = ({ allowedFileTypes }: Props) => {
  const { toast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([])
  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([])

  const allowedTypes = supportedFileTypes.filter(item =>
    allowedFileTypes?.includes(item.type),
  )
  const allowedFileMimeTypes = allowedTypes.map(type => type.allowedMimeTypes)
  const fixedColorClassName =
    allowedTypes && allowedTypes.length === 1
      ? getFileIconAndColor(allowedTypes[0].type).color
      : undefined

  // console.log({ allowedTypes, fixedColorClassName, uploadedFiles, filesToUpload })

  const onUploadProgress = (
    progressEvent: AxiosProgressEvent,
    file: File,
    cancelSource: CancelTokenSource,
  ) => {
    const progress = Math.round(
      (progressEvent.loaded / (progressEvent.total ?? 0)) * 100,
    )

    if (progress === 100) {
      setUploadedFiles(prevUploadedFiles => {
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
        })

        return [...prevUploadedFiles, fileWithPreview]
      })

      setFilesToUpload(prevUploadProgress => {
        return prevUploadProgress.filter(item => item.File !== file)
      })

      return
    }

    setFilesToUpload(prevUploadProgress => {
      return prevUploadProgress.map(item => {
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

  const uploadAsset = async (
    file: File,
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
    cancelSource: CancelTokenSource,
  ) => {
    const signResponse = await axios.post('/api/media/upload/sign-request', {
      filename: file.name,
      contentType: file.type,
    })

    if (!signResponse || !signResponse.data) {
      throw new Error('sign request failed')
    }

    const { signedUrl } = signResponse.data as { signedUrl: string }

    return axios.put(signedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress,
      cancelToken: cancelSource.token,
    })
  }

  const removeFile = (file: File) => {
    setFilesToUpload(prevUploadProgress => {
      return prevUploadProgress.filter(item => item.File !== file)
    })

    setUploadedFiles(prevUploadedFiles => {
      return prevUploadedFiles.filter(item => item !== file)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setFilesToUpload(prevUploadProgress => {
      return [
        ...prevUploadProgress,
        ...acceptedFiles.map(file => {
          return {
            progress: 0,
            File: file,
            source: null,
          }
        }),
      ]
    })

    // cloudinary upload
    const fileUploadBatch = acceptedFiles.map(file => {
      const formData = new FormData()
      formData.append('file', file)

      const cancelSource = axios.CancelToken.source()
      return uploadAsset(
        file,
        progressEvent => onUploadProgress(progressEvent, file, cancelSource),
        cancelSource,
      )
    })

    try {
      await Promise.all(fileUploadBatch)
      toast({
        className: 'flex p-4',
        title: 'Upload finished',
        description: (
          <div className="mt-2 rounded-md bg-popover p-2">
            <code className=" text-xs text-foreground">
              {acceptedFiles.length} Files
            </code>
          </div>
        ),
        // action: <ToastAction altText="Go to task">Show Task</ToastAction>,
      })
    } catch (error) {
      console.error('Error uploading files: ', error)
    }
  }, [])

  // const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: allowedFileMimeTypes.map(item => ) })
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true, // @todo: config based on passed in prop
    maxFiles: 2, //@todo: config based on passed in prop
    accept: allowedFileMimeTypes
      .flatMap(mimeTypes => mimeTypes)
      .reduce((acc: { [key: string]: string[] }, mimeType) => {
        acc[mimeType] = []
        return acc
      }, {}),
  })

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () =>
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview || ''))
  }, [uploadedFiles])

  return (
    <div className="flex-grow">
      <div>
        <label
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center w-full py-6 border rounded-lg cursor-pointer bg-card',
            `border-${fixedColorClassName}`,
          )}
        >
          <div className="text-center">
            <div className=" border p-2 rounded-md max-w-min mx-auto">
              <UploadCloud size={20} />
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold">Drag files</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Click to upload files &#40;files should be under 10 MB &#41;
            </p>
            <p className="text-xs text-muted-foreground">
              {allowedFileTypes?.join(', ')} | (
              {allowedFileMimeTypes.join(', ')})
            </p>
          </div>
        </label>

        <Input
          {...getInputProps()}
          id="dropzone-file"
          accept={allowedFileMimeTypes.join(', ')}
          type="file"
          className="hidden"
        />
      </div>

      {filesToUpload.length > 0 && (
        <div className="bg-card p-2 mt-4 rounded-lg">
          <p className="font-medium my-2 mt-4 text-muted-foreground text-sm">
            Uploading...
          </p>
          <div className="bg-card space-y-2">
            {filesToUpload.map(fileUploadProgress => {
              return (
                <div
                  key={fileUploadProgress.File.lastModified}
                  className="flex justify-between gap-2 rounded-lg overflow-hidden border border-border group"
                >
                  <div className="flex items-center flex-1 p-2">
                    <div className="text-white">
                      {
                        getFileIconAndColor(
                          getTypeByMimeType(
                            fileUploadProgress.File.type as MimeType,
                          ),
                        ).icon
                      }
                    </div>

                    <div className="w-full ml-2 space-y-1">
                      <div className="text-xs flex justify-between">
                        <p className="text-muted-foreground">
                          {fileUploadProgress.File.name.slice(0, 25)}
                        </p>
                        <span>{fileUploadProgress.progress}%</span>
                      </div>
                      <Progress
                        value={fileUploadProgress.progress}
                        className={`bg-${
                          getFileIconAndColor(
                            getTypeByMimeType(
                              fileUploadProgress.File.type as MimeType,
                            ),
                          ).color
                        }`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (fileUploadProgress.source)
                        fileUploadProgress.source.cancel('Upload cancelled')
                      removeFile(fileUploadProgress.File)
                    }}
                    className="bg-destructive text-destructive-foreground items-center justify-center cursor-pointer px-2 hidden group-hover:flex"
                  >
                    <X size={20} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="bg-card p-2 mt-4 rounded-lg">
          <p className="font-medium mb-2 text-muted-foreground text-sm">
            Uploaded Files
          </p>
          <div className="space-y-2">
            {uploadedFiles.map(file => {
              return (
                <div
                  key={file.lastModified}
                  className="relative flex justify-between gap-2 rounded-lg overflow-hidden border border-border group h-14"
                >
                  <div className="flex items-center p-2">
                    <div className="relative flex text-white h-14 w-14 rounded overflow-hidden">
                      {file.preview ? (
                        <>
                          {file.type.startsWith('image') ? (
                            <Image
                              src={file.preview}
                              alt={file.preview}
                              fill={true}
                              objectFit={'contain'}
                              onLoad={() =>
                                URL.revokeObjectURL(file.preview || '')
                              }
                            />
                          ) : (
                            <video
                              src={file.preview}
                              controls={false}
                              controlsList={'nodownload'}
                              className="absolute object-contain self-center"
                              onContextMenu={(e: React.MouseEvent) =>
                                e.preventDefault()
                              }
                              onLoad={() =>
                                URL.revokeObjectURL(file.preview || '')
                              }
                            />
                          )}
                        </>
                      ) : (
                        <>
                          {
                            getFileIconAndColor(
                              getTypeByMimeType(file.type as MimeType),
                            ).icon
                          }
                        </>
                      )}
                    </div>
                    <div className="w-full ml-2 space-y-1">
                      <div className="text-sm flex justify-between">
                        <p className="text-muted-foreground">
                          {file.name.slice(0, 25)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file)}
                    className="absolute h-full right-0 bg-destructive text-destructive-foreground items-center justify-center cursor-pointer px-2 hidden group-hover:flex"
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

export default FileUploader
