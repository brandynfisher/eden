import axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify'

// @ts-ignore
export const fetcher = (...args) =>
  // @ts-ignore
  fetch(...args).then(res => res.json())

export const handleAxiosError = (
  error: AxiosError | unknown,
  customMessage?: string,
) => {
  if (axios.isAxiosError(error)) {
    const message = customMessage ?? error.response?.data.error
    toast.error(message)
  }
}
