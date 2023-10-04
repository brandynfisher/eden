import { CONFIG } from '@/lib/config'
import { message } from 'antd'
import { MessageInstance } from 'antd/es/message/interface'
import axios, { AxiosError } from 'axios'

// @ts-ignore
export const fetcher = async (...args) => {
  // @ts-ignore
  const res = await fetch(...args)

  console.log(res)

  if (res.status === 401) {
    return null
  }

  return res.json()
}

export const handleAxiosError = (
  error: AxiosError | unknown,
  messageInstance: MessageInstance,
  customMessage?: string,
) => {
  if (axios.isAxiosError(error)) {
    const toastMessage =
      customMessage ??
      (error.response?.data.message || 'Unknown Error has occurred')

    message.destroy()
    message.error(toastMessage)
  }
}

export const getAdminHeaders = () => {
  return {
    'X-Api-Key': CONFIG.EDEN_ADMIN_API_KEY,
    'X-Api-Secret': CONFIG.EDEN_ADMIN_API_SECRET,
  }
}
