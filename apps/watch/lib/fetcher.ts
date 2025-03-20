import axios, { AxiosError } from 'axios'

export const fetcher = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const handleAxiosServerError = (error: AxiosError | unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data.message ||
      error.response?.data.error ||
      'Unknown Error has occurred'
    )
  }

  return 'Unknown Error has occurred'
}
