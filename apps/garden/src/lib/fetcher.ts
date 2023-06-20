import { CONFIG } from '@/lib/config'
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
    const message =
      customMessage ??
      (error.response?.data.message || 'Unknown Error has occurred')
    toast.error(message)
  }
}

export const getAdminHeaders = () => {
  return {
    'X-Api-Key': CONFIG.EDEN_ADMIN_API_KEY,
    'X-Api-Secret': CONFIG.EDEN_ADMIN_API_SECRET,
  }
}
