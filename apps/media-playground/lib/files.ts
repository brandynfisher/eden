import { getCloudfrontOriginalUrl } from './media'
import { FileType, MimeType } from '@/types/Media'
import { downloadZip } from '@/utils/downloader.util'
import axios, { AxiosProgressEvent, CancelTokenSource } from 'axios'
import exifr from 'exifr'
import { hash as fastSha256 } from 'fast-sha256'

const MAX_IMAGE_PIXELS = 4000000 // 4MP
const MAX_IMAGE_WIDTH = 1920
const MAX_IMAGE_HEIGHT = 1920

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
  const buffer = new Uint8Array(await file.arrayBuffer())
  const webCrypto =
    (typeof self !== 'undefined' &&
      ((self as unknown as { crypto?: Crypto }).crypto ||
        (self as unknown as { msCrypto?: Crypto }).msCrypto ||
        (self as unknown as { webkitCrypto?: Crypto }).webkitCrypto)) ||
    undefined

  if (webCrypto?.subtle?.digest) {
    const hashBuffer = await webCrypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Fallback for environments (iOS WKWebView) without SubtleCrypto
  const digest = fastSha256(buffer)
  return Array.from(digest)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export const requestSignedUrl = async (
  fileHash: string,
  fileType: string,
  fileExtension: string,
): Promise<string> => {
  try {
    const response = await axios.post('/api/media/upload/sign-request', {
      filename: `${fileHash}.${fileExtension}`,
      contentType: fileType,
    })
    return response.data.signedUrl // Adjust according to your actual API response
  } catch (error) {
    console.error('Error requesting signed URL:', error)
    throw new Error('Failed to get signed URL')
  }
}

// Add this function to handle EXIF rotation
export const rotateImageBasedOnExif = async (file: File): Promise<File> => {
  // Only process image files
  if (!file.type.startsWith('image/')) {
    return file
  }

  // React Native / webviews on older mobile browsers may not expose DOM
  // imaging APIs. In that case, skip transformation and upload the original
  // file to avoid hard failures.
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
          0.85,
        ) // 85% quality

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

export const uploadFileToS3 = async (
  options: UploadOptions,
  maxRetries = 3,
  retryDelay = 1000,
) => {
  let { file } = options
  const { onUploadProgress, cancelSource } = options

  // Auto-rotate image based on EXIF data before upload
  file = await rotateImageBasedOnExif(file)

  // Extract the original file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin'

  const fileHash = await getFileHash(file)
  const signedUrl = await requestSignedUrl(fileHash, file.type, fileExtension)
  const config = {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress,
    cancelToken: cancelSource.token,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.put(signedUrl, file, config)

      if (response.status === 200) {
        const fileObjURL = URL.createObjectURL(file)
        const fileMetadata = await getUploadedMediaMetadata(file, fileObjURL)

        const finalFile = Object.assign(file, {
          fileUrl: getCloudfrontOriginalUrl(signedUrl.split('?')[0]),
          preview: fileObjURL,
          ...fileMetadata,
        })
        return finalFile
      }

      throw new Error(`Upload error - status ${response.status}`)
    } catch (error) {
      lastError = error as Error

      // Surface detailed logs to JS console for debugging mobile WebView issues
      if (axios.isAxiosError(error)) {
        console.error('uploadFileToS3 failed', {
          attempt,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          responseText: error.request?.responseText,
          requestUrl: error.config?.url,
          message: error.message,
        })
      } else {
        console.error('uploadFileToS3 failed', {
          attempt,
          message: (error as Error)?.message,
        })
      }

      // Check if this is a cancellation error
      if (axios.isCancel(error)) {
        throw error // Re-throw cancellation errors
      }

      if (axios.isAxiosError(error) && error.response?.status === 503) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
      }

      // If it's not a 503 error or we're out of retries, throw the error
      throw lastError
    }
  }

  throw lastError
}

export const getUploadedMediaMetadata = async (
  file: File,
  fileObjURL: string,
) => {
  if (file.type.startsWith('image')) {
    return {
      dimensions: await getDimensionsFromImgBlob(file),
    }
  }

  if (file.type.startsWith('video')) {
    const videoMetadata = await getVideoMetadata(fileObjURL)

    if (!videoMetadata) {
      return {}
    }

    return {
      dimensions: {
        width: videoMetadata.width,
        height: videoMetadata.height,
      },
      duration: videoMetadata.duration,
    }
  }

  return undefined
}

interface VideoMetadata {
  width: number
  height: number
  duration: number
  // Add more properties here if needed
}

export const getVideoMetadata = async (
  fileObjURL: string,
): Promise<VideoMetadata | undefined> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return undefined
  }

  return new Promise<VideoMetadata | undefined>(resolve => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onMetadataLoaded)
      video.removeEventListener('error', onError)
      URL.revokeObjectURL(fileObjURL) // Clean up the object URL
    }

    const onMetadataLoaded = () => {
      const metadata: VideoMetadata = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        // Populate additional properties here
      }
      resolve(metadata)
      cleanup()
    }

    const onError = () => {
      console.error('An error occurred while loading video metadata')
      resolve(undefined)
      cleanup()
    }

    video.addEventListener('loadedmetadata', onMetadataLoaded)
    video.addEventListener('error', onError)
    video.src = fileObjURL
  })
}

export const getDimensionsFromImgBlob = async (file: File) => {
  try {
    const blob = new Blob([file], { type: file.type })

    // Prefer createImageBitmap when available (desktop browsers)
    if (typeof createImageBitmap === 'function') {
      const imgBitmap = await createImageBitmap(blob)
      const { width, height } = imgBitmap
      imgBitmap.close()

      return { width, height }
    }

    // Fallback for iOS Safari / React Native WebView where createImageBitmap
    // is missing. Load into an Image element to read natural dimensions.
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      return await new Promise<{ width: number; height: number } | undefined>(
        resolve => {
          const objectUrl = URL.createObjectURL(blob)
          const img = new Image()

          img.onload = () => {
            const width = img.naturalWidth || img.width
            const height = img.naturalHeight || img.height
            URL.revokeObjectURL(objectUrl)
            resolve({ width, height })
          }

          img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(undefined)
          }

          img.src = objectUrl
        },
      )
    }

    // As a last resort, return undefined instead of throwing
    return undefined
  } catch (error) {
    console.warn('Unable to read image dimensions', error)
    return undefined
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

  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 Bytes'
  }

  const base = useBinaryUnits ? 1024 : 1000
  const units = useBinaryUnits
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(base))

  return `${(bytes / Math.pow(base, i)).toFixed(decimals)} ${units[i]}`
}

export const downloadFile = async (url: string, fileName: string) => {
  if (!window || !document) {
    return undefined
  }

  try {
    const parsedUrl = new URL(url)
    const extension = parsedUrl.pathname.split('.').pop()
    const response = await axios.get(
      `/api/media/download?url=${url}&fileName=${fileName}&fileExtension=${extension}`,
    )
    const link = document.createElement('a')
    link.download = `${fileName}.${extension}`
    link.href = response.data.signedUrl
    // link.target = '_blank'
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

    await downloadZip({
      url: `/api/media/download/bulk`,
      data: { files: requestPayload },
      method: 'POST',
    })

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
  const type = mimeType?.split('/')[0] || 'other'

  if (type === 'application') {
    return 'zip'
  }

  return type as FileType
}
