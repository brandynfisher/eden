import { WebAPICallOptions, WebAPICallResult } from '../types'
import axios, { AxiosRequestConfig } from 'axios'

// Arguments

export interface MediaUploadArguments extends WebAPICallOptions {
  media: Buffer
}

// Requests

export const mediaUploadRequestConfig = (args: MediaUploadArguments) => {
  return new Promise<AxiosRequestConfig>((resolve, reject) => {
    axios.get('/media/upload/sign-request').then(signResponse => {
      if (!signResponse) {
        reject('Sign request failed')
        throw new Error('sign request failed')
      }

      const formData = new FormData()
      const cancelSource = axios.CancelToken.source()
      const { apiKey, timestamp, signature, cloudName } = signResponse.data

      const blob = new Blob([args.media])
      formData.append('file', blob)
      formData.append('api_key', apiKey)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      formData.append('folder', 'user_uploads')

      resolve({
        method: 'POST',
        url: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        cancelToken: cancelSource.token,
      })
    })

    // const signResponse = await axios.get('/media/upload/sign-request').then(() => {})
    //
    // if (!signResponse) {
    //   throw new Error('sign request failed')
    // }
    //
    // const formData = new FormData()
    // const cancelSource = axios.CancelToken.source()
    //
    // const { apiKey, timestamp, signature, cloudName } = signResponse.data
    //
    // const blob = new Blob([args.media])
    // const form = new FormData()
    // // form.append('file', blob)
    // return {
    //   method: 'POST',
    //   url: 'media/upload',
    //   data: form,
    //   headers: {
    //     'Content-Type': 'multipart/form-data',
    //   },
    // }
  })
}

// Responses

export type MediaUploadResponse = WebAPICallResult & {
  error?: string
  url?: string
}
