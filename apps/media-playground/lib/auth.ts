import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export const getAuthToken = async (req: NextRequest) => {
  const { getToken } = getAuth(req)
  const authToken = await getToken()
  return authToken || undefined
}

export const getAuthUserId = async (req: NextRequest) => {
  const { userId } = getAuth(req)
  return userId || undefined
}

export const getAuthHeaders = async (req: NextRequest) => {
  const authToken = req ? await getAuthToken(req) : ''

  return {
    cookie: req ? req.cookies.getAll() : '',
    Authorization: authToken ? `Bearer ${authToken}` : '',
  }
}
