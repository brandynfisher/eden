import axios, { AxiosProgressEvent } from 'axios'
import type { RcFile } from 'antd/es/upload'

// export const downloadFileBlob = async (url: string, fileName: string) => {
//   try {
//     const response = await fetch(url)
//     const blob = await response.blob()
//     const blobUrl = URL.createObjectURL(blob)
//
//     const link = document.createElement('a')
//     link.href = blobUrl
//     link.download = fileName
//     document.body.appendChild(link)
//     link.click()
//     document.body.removeChild(link)
//
//     URL.revokeObjectURL(blobUrl)
//     return true
//   } catch (error) {
//     console.error('Error downloading creation:', error)
//     return false
//   }
// }

export const downloadFile = async (url: string, fileName: string) => {
  try {
    const parsedUrl = new URL(url)
    const extension = parsedUrl.pathname.split('.').pop()
    const response = await axios.get(
      `/api/media/download?url=${url}&fileName=${fileName}.${extension}`,
    )
    const link = document.createElement('a')
    link.download = `${fileName}.${extension}`
    link.href = response.data.signedUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  } catch (error) {
    console.error('Error downloading creation:', error)
    return false
  }
}

export const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })

// export const getFileHash = async (file: File): Promise<string> => {
//   const arrayBuffer = await file.arrayBuffer()
//   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
//   const hashArray = Array.from(new Uint8Array(hashBuffer)) // Convert buffer to byte array
//   const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') // Convert bytes to hex string
//   return hashHex
// }
//
// // Function to request a signed URL from S3
// export const requestSignedUrl = async (
//   fileHash: string,
//   fileType: string,
// ): Promise<string> => {
//   try {
//     const response = await axios.post('/api/media/upload', {
//       filename: `${fileHash}.${fileType.split('/')[1]}`,
//       contentType: fileType,
//     })
//     return response.data.signedUrl // Adjust according to your actual API response
//   } catch (error) {
//     console.error('Error requesting signed URL:', error)
//     throw new Error('Failed to get signed URL')
//   }
// }

export interface UploadRequestOptions {
  file: RcFile | File
  onSuccess: (response: object, file: File | RcFile) => void
  onError: (error: Error) => void
  onProgress: (event: { percent: number }) => void
}

// export const uploadFileToS3 = async (options: UploadRequestOptions) => {
//   const { file, onSuccess, onError, onProgress } = options
//
//   const fileHash = await getFileHash(file)
//   const signedUrl = await requestSignedUrl(fileHash, file.type)
//   const config = {
//     headers: {
//       'Content-Type': file.type,
//     },
//     onUploadProgress: (event: AxiosProgressEvent) => {
//       const total = event.total ? event.total : 1
//       onProgress({ percent: (event.loaded / total) * 100 })
//     },
//   }
//
//   const response = await axios.put(signedUrl, file, config)
//
//   if (response.status === 200) {
//     onSuccess(
//       {
//         fileUrl: signedUrl.split('?')[0],
//       },
//       file,
//     )
//   } else {
//     onError(new Error('Upload failed'))
//   }
// }

export const uploadFileToCloudinary = async (options: UploadRequestOptions) => {
  const { file, onSuccess, onError, onProgress } = options

  const signResponse = await axios.get('/api/media/upload/sign-request')

  if (!signResponse) {
    throw new Error('sign request failed')
  }

  const formData = new FormData()
  const cancelSource = axios.CancelToken.source()

  const { apiKey, timestamp, signature, cloudName } = signResponse.data

  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  // formData.append('eager', 'c_pad,h_300,w_400|c_crop,h_200,w_260') // @todo: needs to match what's configured in api signing
  formData.append('folder', 'user_uploads') // @todo: needs to match api signature config

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    formData,
    {
      onUploadProgress: (event: AxiosProgressEvent) => {
        const total = event.total ? event.total : 1
        onProgress({ percent: (event.loaded / total) * 100 })
      },
      cancelToken: cancelSource.token,
    },
  )

  if (response.status === 200) {
    onSuccess(
      {
        fileUrl: response.data.secure_url,
      },
      file,
    )
  } else {
    onError(new Error('Upload failed'))
  }
}
