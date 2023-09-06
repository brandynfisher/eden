import { CONFIG } from '@/lib/config'
import { getAuth } from '@clerk/nextjs/server'
import { message } from 'antd'
import { MessageInstance } from 'antd/es/message/interface'
import axios, { AxiosError } from 'axios'
import { NextApiRequest } from 'next'

// @ts-ignore
export const fetcher = (...args) =>
  // @ts-ignore
  fetch(...args, { cache: 'no-store' }).then(res => res.json())

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

export const getSessionCookie = async (request: NextApiRequest) => {
  const { getToken } = getAuth(request)
  const authToken = await getToken()
  return authToken || undefined
}
