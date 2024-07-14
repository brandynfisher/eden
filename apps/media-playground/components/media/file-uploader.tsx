'use client'

import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { uploadFileToS3 } from '@/lib/files'
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

export type FileWithPreview = File & {
  preview?: string
  fileUrl?: string
}

type Props = {
  onChange: (fileUrls: string | string[]) => void
  allowedFileTypes?: FileType[]
  maxFiles?: number
  allowMultiple?: boolean
}

const FileUploader = ({
  allowedFileTypes,
  maxFiles,
  allowMultiple,
  onChange,
}: Props) => {
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

  console.log({
    maxFiles,
    allowedTypes,
    fixedColorClassName,
    uploadedFiles,
    filesToUpload,
  })

  const onUploadProgress = (
    progressEvent: AxiosProgressEvent,
    file: File,
    cancelSource: CancelTokenSource,
  ) => {
    const progress = Math.round(
      (progressEvent.loaded / (progressEvent.total ?? 0)) * 100,
    )

    if (progress === 100) {
      // setUploadedFiles(prevUploadedFiles => {
      //   console.log('progress 100', prevUploadedFiles, file)
      //   const fileWithPreview = Object.assign(file, {
      //     preview: URL.createObjectURL(file),
      //     fileUrl: file.fileUrl,
      //   })
      //
      //   return [...prevUploadedFiles, fileWithPreview]
      // })

      // setFilesToUpload(prevUploadProgress => {
      //   return prevUploadProgress.filter(item => item.File !== file)
      // })

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
    try {
      return uploadFileToS3({
        file,
        onUploadProgress,
        cancelSource,
      })
    } catch (e) {
      console.error(e)
      toast({
        className: 'flex p-4 text-red-600',
        title: 'Failed to upload file',
        description: <div className="rounded-md text-primary">{file.name}</div>,
      })
    }
  }

  const removeFile = (file: File) => {
    setFilesToUpload(prevUploadProgress => {
      return prevUploadProgress.filter(item => item.File !== file)
    })

    setUploadedFiles(prevUploadedFiles => {
      // console.log({prevUploadedFiles})
      const newState = prevUploadedFiles.filter(item => item.name !== file.name)
      // console.log('remove', newState)
      const filtered = newState
        .map(item => (item ? item.fileUrl || '' : ''))
        .filter(Boolean)
      // console.log(
      //   'onChange',
      //   filtered[0],
      //   maxFiles === 1 ? filtered[0] : filtered,
      // )
      onChange(maxFiles === 1 ? filtered[0] : filtered)
      return newState
    })
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
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

      // upload a batch of files
      const fileUploadBatch = acceptedFiles.map(async file => {
        const formData = new FormData()
        formData.append('file', file)

        const cancelSource = axios.CancelToken.source()
        const asset = await uploadAsset(
          file,
          progressEvent => onUploadProgress(progressEvent, file, cancelSource),
          cancelSource,
        )

        setUploadedFiles(previousFiles => {
          console.log({ previousFiles, asset })

          const previousUrls = previousFiles
            .map(prevFile => prevFile.fileUrl || '')
            .filter(Boolean)
          // merge the arrays and filter out duplicates

          if (!asset) {
            console.log('not asset')
            return previousFiles
          }

          const existingFile = previousFiles.filter(
            prevItem => prevItem.fileUrl === asset.fileUrl,
          )

          if (existingFile.length) {
            console.log('existing file', asset)
            return previousFiles
          }

          const uniqueUrls = Array.from(
            new Set([...previousUrls, asset.fileUrl]),
          )

          console.log(maxFiles, maxFiles === 1 ? uniqueUrls[0] : uniqueUrls)
          // Call onChange according to the maxFiles prop
          onChange(maxFiles === 1 ? uniqueUrls[0] : uniqueUrls)

          return [...previousFiles, asset as FileWithPreview]
        })

        setFilesToUpload(prevUploadProgress => {
          return prevUploadProgress.filter(item => item.File !== file)
        })

        return asset
      })

      try {
        const uploadRes = await Promise.all(fileUploadBatch)

        if (!uploadRes) {
          // errored or something
          // @todo: handle error, show toast, etc?
          return false
        }

        // console.log('upload success batch', uploadRes)
        //
        // const newUrls = uploadRes
        //   .map(item => (item ? item?.fileUrl : ''))
        //   .filter(Boolean)
        //
        // // console.log({newUrls, uploadedFiles})
        // if (!newUrls) {
        //   return
        // }

        // setUploadedFiles(previousFiles => {
        //   console.log({previousFiles})
        //
        //   const previousUrls = previousFiles.map(prevFile => prevFile.fileUrl || '').filter(Boolean)
        //   // merge the arrays and filter out duplicates
        //   const uniqueUrls = Array.from(new Set([...previousUrls, ...newUrls]))
        //
        //   console.log(maxFiles, maxFiles === 1 ? uniqueUrls[0] : uniqueUrls)
        //   // Call onChange according to the maxFiles prop
        //   onChange(maxFiles === 1 ? uniqueUrls[0] : uniqueUrls)
        //
        //   if (!uploadRes) {
        //     return previousFiles
        //   }
        //
        //   const uploads = uploadRes.filter(item => item && !previousUrls.includes(item?.fileUrl))
        //
        //   if (!uploads) {
        //     return previousFiles
        //   }
        //
        //   return [ ...previousFiles, ...(uploads as FileWithPreview[]) ]
        // })

        // Get the URLs of previously uploaded files
        // const previousUrls = uploadedFiles
        //   .map(file => file.fileUrl || '')
        //   .filter(Boolean)

        // // merge the arrays and filter out duplicates
        // const uniqueUrls = Array.from(new Set([...previousUrls, ...newUrls]))
        //
        // console.log(maxFiles, maxFiles === 1 ? uniqueUrls[0] : uniqueUrls)
        // // Call onChange according to the maxFiles prop
        // onChange(maxFiles === 1 ? uniqueUrls[0] : uniqueUrls)

        toast({
          className: 'flex p-4',
          title: 'Upload finished',
          description: (
            <div className="mt-2 rounded-md bg-popover p-2">
              <code className="text-xs text-foreground">
                {acceptedFiles.length} Files
              </code>
            </div>
          ),
          // action: <ToastAction altText="Go to task">Show Task</ToastAction>,
        })
      } catch (error) {
        console.error('Error uploading files: ', error)
      }
    },
    [maxFiles, onChange], // Include uploadedFiles in dependency array
  )

  // const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: allowedFileMimeTypes.map(item => ) })
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: allowMultiple,
    maxFiles: maxFiles && maxFiles > 1 ? maxFiles : 1,
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
              <span className="font-semibold">
                Upload {maxFiles && maxFiles > 1 ? `up to ${maxFiles}` : ''}{' '}
                {allowedFileTypes
                  ?.map(type => `${type}${allowMultiple ? 's' : ''}`)
                  .join(',')}
              </span>
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
