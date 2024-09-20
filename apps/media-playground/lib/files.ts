import { sanitize } from '@/lib/strings'
import { FileType, MimeType } from '@/types/Media'
import axios, { AxiosProgressEvent, CancelTokenSource } from 'axios'

type UploadOptions = {
  file: File
  onUploadProgress: (progressEvent: AxiosProgressEvent) => void
  cancelSource: CancelTokenSource
}

export const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })

export const getFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer)) // Convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') // Convert bytes to hex string
  return hashHex
}

export const requestSignedUrl = async (
  fileHash: string,
  fileType: string,
): Promise<string> => {
  try {
    const response = await axios.post('/api/media/upload/sign-request', {
      filename: `${fileHash}.${fileType.split('/')[1]}`,
      contentType: fileType,
    })
    return response.data.signedUrl // Adjust according to your actual API response
  } catch (error) {
    console.error('Error requesting signed URL:', error)
    throw new Error('Failed to get signed URL')
  }
}

export const uploadFileToS3 = async (options: UploadOptions) => {
  const { file, onUploadProgress } = options
  const cancelSource = axios.CancelToken.source()

  const fileHash = await getFileHash(file)
  const signedUrl = await requestSignedUrl(fileHash, file.type)
  const config = {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress,
    cancelToken: cancelSource.token,
  }

  const response = await axios.put(signedUrl, file, config)

  const fileObjURL = URL.createObjectURL(file)

  const fileWithExtra = Object.assign(file, {
    fileUrl: signedUrl.split('?')[0],
    preview: fileObjURL,
    dimensions: await getUploadedMediaDimensions(file, fileObjURL),
  })

  if (response.status !== 200) {
    throw new Error(`Upload error - status ${response.status}`)
  }

  return fileWithExtra
}

export const getUploadedMediaDimensions = async (
  file: File,
  fileObjURL: string,
) => {
  if (file.type.startsWith('image')) {
    return getDimensionsFromImgBlob(file)
  }

  if (file.type.startsWith('video')) {
    return getDimensionsFromVideo(fileObjURL)
  }

  return undefined
}

export const getDimensionsFromVideo = async (fileObjURL: string) => {
  if (!window || !document) {
    return undefined
  }

  const video = document.createElement('video')
  video.preload = 'metadata'

  const dimensions = await new Promise<{ width: number; height: number }>(
    resolve => {
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onMetadataLoaded)
        video.removeEventListener('error', onError)
      }

      const onMetadataLoaded = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight })
        cleanup()
      }

      const onError = () => {
        console.error('An error occurred while loading video metadata')
        cleanup()
      }

      video.addEventListener('loadedmetadata', onMetadataLoaded)
      video.addEventListener('error', onError)
      video.src = fileObjURL
    },
  )

  return dimensions
}

export const getDimensionsFromImgBlob = async (file: File) => {
  const blob = new Blob([file], { type: file.type })
  const imgBitmap = await createImageBitmap(blob)
  const { width, height } = imgBitmap
  imgBitmap.close()

  return {
    width,
    height,
  }
}

export function convertBytes(
  bytes: number,
  options: { useBinaryUnits?: boolean; decimals?: number } = {},
): string {
  const { useBinaryUnits = false, decimals = 2 } = options

  if (decimals < 0) {
    throw new Error(`Invalid decimals ${decimals}`)
  }

  const base = useBinaryUnits ? 1024 : 1000
  const units = useBinaryUnits
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(base))

  return `${(bytes / Math.pow(base, i)).toFixed(decimals)} ${units[i]}`
}

const sanitizeFilenameForCloudinaryBug = (fileName: string) => {
  return fileName.replaceAll('original', 'Original')
}

export const getDownloadFileName = (
  userName: string,
  itemId: string,
  itemName?: string,
) => {
  const fileName = encodeURIComponent(
    `Eden-${userName}-${
      itemName ? sanitize(itemName.slice(0, 128)) : '___'
    }-${itemId}`,
  )
  return sanitizeFilenameForCloudinaryBug(fileName)
}

export const downloadFile = async (url: string, fileName: string) => {
  if (!window || !document) {
    return undefined
  }

  try {
    // console.log({ url, fileName })
    const parsedUrl = new URL(url)
    const extension = parsedUrl.pathname.split('.').pop()
    const response = await axios.get(
      `/api/media/download?url=${url}&fileName=${fileName}&fileExtension=${extension}`,
    )
    const link = document.createElement('a')
    link.download = `${fileName}.${extension}`
    link.href = response.data.signedUrl
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  } catch (error) {
    console.error('Error downloading creation:', error)
    return false
  }
}

export type DownloadFile = {
  url: string
  fileName: string
  fileExtension?: string
}

export const downloadFiles = async (
  files: DownloadFile[],
): Promise<boolean> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // console.error('Download can only be performed in a browser environment.')
    return false
  }

  if (!files || !Array.isArray(files) || files.length === 0) {
    console.error('No files provided for download.')
    return false
  }

  try {
    const requestPayload: DownloadFile[] = files.map(file => {
      const parsedUrl = new URL(file.url)
      const extension = parsedUrl.pathname.split('.').pop()

      return {
        ...file,
        fileExtension: extension,
      }
    })

    const response = await axios.post(
      '/api/media/download/bulk',
      { files: requestPayload },
      {
        responseType: 'blob', // Important to receive the response as a Blob
      },
    )

    const contentType = response.headers['content-type']
    const contentDisposition = response.headers['content-disposition']

    if (contentType !== 'application/zip') {
      console.error('Unexpected content type:', contentType)
      return false
    }

    // **6. Extract the Filename from Content-Disposition**
    let fileName = 'eden_downloads.zip' // Default filename
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1]
      }
    }

    const blob = new Blob([response.data], { type: 'application/zip' })

    const link = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url) // Clean up the URL object

    return true
  } catch (error) {
    console.error('Error downloading ZIP:', error)

    if (axios.isAxiosError(error) && error.response) {
      console.error('Server responded with:', error.response.data)
    } else {
      console.error(
        'An unexpected error occurred:',
        (error as unknown as { message?: string }).message || '',
      )
    }

    return false
  }
}

export const getFileTypeByMimeType = (mimeType?: MimeType | string) => {
  return mimeType ? (mimeType.split('/')[0] as FileType) : 'other'
}
