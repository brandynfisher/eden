import axios, { AxiosError } from 'axios'

export const fetcher = async <T>(...args: Parameters<typeof fetch>): Promise<T> => {
  const response = await fetch(...args)

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  return response.json()
}

export const handleAxiosServerError = (error: AxiosError | unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data.message || 'Unknown Error has occurred'
  }

  return 'Unknown Error has occurred'
}