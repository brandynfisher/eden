import { getAuth } from '@clerk/nextjs/server'
import { NextApiRequest } from 'next'

export const getAuthToken = async (req: NextApiRequest) => {
  const { getToken } = getAuth(req)
  const authToken = await getToken()
  return authToken || undefined
}

export const getAuthUserId = async (req: NextApiRequest) => {
  const { userId } = getAuth(req)
  return userId || undefined
}

export const getAuthHeaders = async (req: NextApiRequest) => {
  const authToken = req ? await getAuthToken(req) : ''

  return {
    cookie: req ? req.headers.cookie : '',
    Authorization: authToken ? `Bearer ${authToken}` : '',
  }
}
