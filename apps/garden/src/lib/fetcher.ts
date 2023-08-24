import { CONFIG } from '@/lib/config'
import { message } from 'antd'
import { MessageInstance } from 'antd/es/message/interface'
import axios, { AxiosError } from 'axios'
import { parse } from 'cookie'
import { NextApiRequest } from 'next'

// @ts-ignore
export const fetcher = (...args) =>
  // @ts-ignore
  fetch(...args).then(res => res.json())

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

export const getSessionCookie = (request: NextApiRequest) => {
  const cookies = parse(request.headers.cookie || '')
  const authToken = cookies.__session
  return authToken
}
