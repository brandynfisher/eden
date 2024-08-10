'use client'

import PreviewVideoPlayer from '@/components/timeline/preview-video-player'
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/custom/sortable'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { convertBytes, uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import { FileType, MimeType } from '@/types/Media'
import { arrayMove } from '@dnd-kit/sortable'
import axios, { AxiosError, AxiosProgressEvent, CancelTokenSource } from 'axios'
import {
  AudioWaveform,
  BanIcon,
  FileImage,
  FolderArchive,
  GripVerticalIcon,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import Truncate from 'react-truncate-inside/es'
import { toast } from 'sonner'

interface FileUploadProgress {
  progress: number
  File: File
  source: CancelTokenSource | null
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
  // console.log({ fileType })
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
]

const getTypeByMimeType = (mimeType: MimeType) => {
  return mimeType.split('/')[0] as FileType
}

export type FileWithPreview = File & {
  preview?: string
  fileUrl?: string
  dimensions?: { width: number; height: number }
}

type Props = {
  value: string[]
  onChange: (fileUrls: string | string[]) => void
  allowedFileTypes?: FileType[]
  maxFiles?: number
  allowMultiple?: boolean
}

// class FakeFile implements File {
//   name: string
//   size: number
//   type: string
//   lastModified: number
//
//   constructor(
//     name: string,
//     type: string = 'image/jpeg',
//     lastModified: number = Date.now(),
//     size: number = 0,
//   ) {
//     this.name = name
//     this.lastModified = lastModified
//     this.size = size
//     this.type = type
//   }
//
//   get webkitRelativePath() {
//     return ''
//   }
//
//   arrayBuffer() {
//     return new Promise<ArrayBuffer>(resolve => {
//       resolve(new ArrayBuffer(0))
//     })
//   }
//
//   slice(_start?: number, _end?: number, contentType?: string) {
//     return new Blob([], { type: contentType || '' })
//   }
//
//   stream() {
//     return new ReadableStream()
//   }
//
//   text() {
//     return Promise.resolve('')
//   }
// }

const FileUploader = ({
  // value,
  allowedFileTypes,
  maxFiles,
  allowMultiple,
  onChange,
}: Props) => {
  // console.log('fileUploader', { value })
  // useEffect(() => {
  //   if (!value) {
  //     return
  //   }
  //
  //   const isArray = Array.isArray(value)
  //
  //   const newUrls = isArray ? value : [value]
  //
  //   const dummyFileList: FileWithPreview[] = newUrls.map((newUrl: string) => {
  //     //@todo: super iffy. the fake class but also the file type. videos will break this?
  //     const fakedFile = new FakeFile(newUrl, 'image/jpeg')
  //     Object.assign(fakedFile, {
  //       preview: newUrl,
  //       fileUrl: newUrl,
  //     })
  //
  //     return fakedFile as FileWithPreview
  //   })
  //   setUploadedFiles(dummyFileList)
  //   onChange(maxFiles === 1 ? newUrls[0] : newUrls)
  // }, [])

  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([])
  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([])

  const allowedTypes = supportedFileTypes.filter(item =>
    allowedFileTypes?.includes(item.type),
  )

  const allowedFileMimeTypes = allowedTypes.map(type => type.allowedMimeTypes)

  // console.log({
  //   maxFiles,
  //   allowedTypes,
  //   fixedColorClassName,
  //   uploadedFiles,
  //   filesToUpload,
  // })

  const onUploadProgress = (
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
      toast.error(`Failed to upload file!`, {
        description: file.name,
        dismissible: true,
        richColors: true,
      })
    }
  }

  const removeFile = (file: File) => {
    setFilesToUpload(prevUploadProgress => {
      return prevUploadProgress.filter(item => item.File !== file)
    })

    setUploadedFiles(prevUploadedFiles => {
      const newState = prevUploadedFiles.filter(item => item.name !== file.name)
      const filtered = newState
        .map(item => (item ? item.fileUrl || '' : ''))
        .filter(Boolean)

      // prevent updating the parent component while the child is re-rendering by moving the parent call to the next tick
      setTimeout(() => {
        onChange(maxFiles === 1 ? filtered[0] : filtered)
      }, 0)
      return newState
    })
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // no files, do nothing
      if (acceptedFiles.length === 0) {
        return
      }

      const newListLength =
        acceptedFiles.length + uploadedFiles.length + filesToUpload.length
      console.log({
        maxFiles,
        newListLength,
        acceptedFiles,
        uploadedFiles,
        filesToUpload,
      })

      // more files than allowed, tell the user
      if (newListLength > (maxFiles || 1)) {
        toast.error(`Too many files!`, {
          description: `Maximum for this field is ${maxFiles} ${typeWordPluralised}`,
          dismissible: true,
          richColors: true,
        })
        return
      }

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
          // console.log({ previousFiles, asset })

          const previousUrls = previousFiles
            .map(prevFile => prevFile.fileUrl || '')
            .filter(Boolean)
          // merge the arrays and filter out duplicates

          if (!asset) {
            // console.log('not asset')
            return previousFiles
          }

          const existingFile = previousFiles.filter(
            prevItem => prevItem.fileUrl === asset.fileUrl,
          )

          if (existingFile.length) {
            // console.log('existing file', asset)
            return previousFiles
          }

          const uniqueUrls = Array.from(
            new Set([...previousUrls, asset.fileUrl]),
          )

          // console.log(maxFiles, maxFiles === 1 ? uniqueUrls[0] : uniqueUrls)
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
          toast.error('Upload failed', {
            dismissible: true,
            richColors: true,
          })
          // @todo: handle error, show toast, etc?
          return false
        }

        toast.success(`Upload finished`, {
          description: (
            <code className="text-xs text-foreground">
              {acceptedFiles.length} Files
            </code>
          ),
          dismissible: true,
          richColors: true,
        })
      } catch (error) {
        console.error('Error uploading files: ', error)
        const errorMessage = axios.isAxiosError(error)
          ? JSON.parse((error as AxiosError).request.responseText)?.message
          : 'Unknown Error'

        toast.error('Error while uploading files', {
          description: JSON.stringify(errorMessage),
          dismissible: true,
          richColors: true,
        })
      }
    },
    [maxFiles, onChange], // Include uploadedFiles in dependency array
  )

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

  const supportsVideo = allowedFileTypes?.includes('video')
  const supportsImage = allowedFileTypes?.includes('image')
  const supportsAny = supportsImage && supportsVideo

  const typeWordPluralised = allowedFileTypes
    ?.map(type => `${type}${allowMultiple ? 's' : ''}`)
    .join(',')

  const handleMove = (activeIndex: number, overIndex: number) => {
    // console.log('handleMove', { activeIndex, overIndex })

    const previousUrls = uploadedFiles
      .map(prevFile => prevFile.fileUrl || '')
      .filter(Boolean)

    setUploadedFiles(arrayMove(uploadedFiles, activeIndex, overIndex))

    setTimeout(() => {
      // const oldOrder = previousUrls
      const newOrder = arrayMove(previousUrls, activeIndex, overIndex)
      // console.log({oldOrder, newOrder})
      onChange(newOrder)
    }, 0)
  }

  return (
    <div className="flex-grow">
      <div>
        <label
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center w-full p-2 border rounded-lg cursor-pointer bg-card',
            supportsVideo ? VideoColor.borderColor : '',
            supportsImage ? ImageColor.borderColor : '',
            supportsAny ? OtherColor.borderColor : '',
          )}
        >
          <div className="text-center">
            <div className=" border p-2 rounded-md max-w-min mx-auto">
              <UploadCloud size={20} />
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold">
                Upload {maxFiles && maxFiles > 1 ? `up to ${maxFiles}` : ''}{' '}
                {typeWordPluralised}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Click here or drop files to upload
              {/*&#40;files should be under xx MB &#41;*/}
            </div>
            {/*<div className='text-xs text-muted-foreground'>*/}
            {/*  {allowedFileTypes?.join(', ')} | (*/}
            {/*  {allowedFileMimeTypes.join(', ')})*/}
            {/*</div>*/}
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

      {filesToUpload.length || uploadedFiles.length ? (
        <div className="bg-card p-2 mt-4 rounded-lg">
          <div className="font-medium mb-2 text-muted-foreground text-sm flex gap-2 flex-wrap justify-between">
            <div>
              Uploaded {uploadedFiles.length + filesToUpload.length}{' '}
              {typeWordPluralised}
            </div>
            <div>(max. {maxFiles})</div>
          </div>
          <div className="space-y-2">
            <PhotoProvider>
              <Sortable
                value={uploadedFiles.map(file => ({
                  id: `${file.name}_${file.lastModified}`,
                }))}
                onMove={({ activeIndex, overIndex }) =>
                  handleMove(activeIndex, overIndex)
                }
                // overlay={
                //   <div className='grid grid-cols-[0.5fr,1fr,auto,auto] items-center gap-2'>
                //     <div className='h-8 w-full rounded-sm bg-primary/10' />
                //     <div className='h-8 w-full rounded-sm bg-primary/10' />
                //     <div className='size-8 shrink-0 rounded-sm bg-primary/10' />
                //     <div className='size-8 shrink-0 rounded-sm bg-primary/10' />
                //   </div>
                // }
              >
                {uploadedFiles.length > 0 &&
                  uploadedFiles.map(file => {
                    return (
                      <SortableItem
                        key={`${file.name}_${file.lastModified}`}
                        value={`${file.name}_${file.lastModified}`}
                        asChild
                      >
                        <div className="relative flex justify-between gap-2 rounded-lg overflow-hidden border border-border group">
                          <div className="flex items-center pl-2 h-20">
                            {maxFiles && maxFiles > 1 ? (
                              <SortableDragHandle
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8 shrink-0 mr-4"
                              >
                                <GripVerticalIcon aria-hidden="true" />
                              </SortableDragHandle>
                            ) : null}
                            <div className="relative text-white rounded overflow-hidden shrink-0 mr-2">
                              {file.preview ? (
                                <>
                                  {file.type.startsWith('image') ? (
                                    <PhotoView src={file.fileUrl}>
                                      <Image
                                        src={file.preview}
                                        alt={file.preview}
                                        height={72}
                                        width={72}
                                        onLoad={() =>
                                          URL.revokeObjectURL(
                                            file.preview || '',
                                          )
                                        }
                                        className="object-contain w-full h-[64px] cursor-zoom-in"
                                      />
                                    </PhotoView>
                                  ) : (
                                    <PreviewVideoPlayer
                                      src={file.preview}
                                      width={72}
                                      height={72}
                                      onLoad={() =>
                                        URL.revokeObjectURL(file.preview || '')
                                      }
                                      className="object-contain w-full h-[64px]"
                                    />
                                    // <video
                                    //   src={file.preview}
                                    //   controls={false}
                                    //   width={64}
                                    //   height={64}
                                    //   controlsList={'nodownload'}
                                    //   className="object-contain self-center w-full h-[64px]"
                                    //   onContextMenu={(e: React.MouseEvent) =>
                                    //     e.preventDefault()
                                    //   }
                                    //   onLoad={() =>
                                    //     URL.revokeObjectURL(file.preview || '')
                                    //   }
                                    // />
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
                            <div className="space-y-1 max-w-[120px] md:max-w-[217px]">
                              <div className="text-sm text-muted-foreground">
                                <Truncate text={file.name} />
                              </div>
                              <div className="text-xs text-muted-foreground/70">
                                {file.dimensions ? (
                                  <div>
                                    {file.dimensions?.width}
                                    <span> x </span>
                                    {file.dimensions?.height}
                                  </div>
                                ) : null}
                                {file.size ? (
                                  <div>
                                    {convertBytes(file.size, {
                                      useBinaryUnits: false,
                                      decimals: 2,
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(file)}
                            className="border-l text-primary/40 hover:bg-destructive hover:text-destructive-foreground items-center justify-center cursor-pointer px-2 group-hover:flex"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </SortableItem>
                    )
                  })}
              </Sortable>
            </PhotoProvider>

            {filesToUpload.length > 0 &&
              filesToUpload.map(fileUploadProgress => {
                return (
                  <div
                    key={fileUploadProgress.File.lastModified}
                    className="flex justify-between gap-2 rounded-lg overflow-hidden border border-border group h-20"
                  >
                    <div className="flex items-center w-full pr-2">
                      <div
                        className={`text-${
                          getFileIconAndColor(
                            getTypeByMimeType(
                              fileUploadProgress.File.type as MimeType,
                            ),
                          ).color
                        } flex justify-center mr-2`}
                      >
                        {
                          getFileIconAndColor(
                            getTypeByMimeType(
                              fileUploadProgress.File.type as MimeType,
                            ),
                          ).icon
                        }
                      </div>
                      <div className="w-full space-y-1">
                        <div className="text-xs flex items-center justify-between">
                          <div className="text-sm text-muted-foreground max-w-[110px] md:max-w-[217px]">
                            <Truncate text={fileUploadProgress.File.name} />
                          </div>
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
                        if (fileUploadProgress.source) {
                          fileUploadProgress.source.cancel('Upload cancelled')
                        }
                        removeFile(fileUploadProgress.File)
                      }}
                      className="border-l text-primary/40 hover:bg-warning hover:text-destructive-foreground items-center justify-center cursor-pointer px-2 group-hover:flex"
                    >
                      <BanIcon size={20} />
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FileUploader
