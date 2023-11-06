import { getAuth } from '@clerk/nextjs/server'
import { NextApiRequest } from 'next'

export const requireAuth = async (authenticate: () => void) => {
  try {
    await authenticate()
  } catch (error) {
    return
  }
}

export const getAuthToken = async (req: NextApiRequest) => {
  const { getToken } = getAuth(req)
  console.log('getting auth token')
  console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  const authToken = await getToken()
  return authToken || undefined
}

export const getAuthUserId = async (req: NextApiRequest) => {
  const { userId } = getAuth(req)
  return userId || undefined
}

export const getAuthHeaders = async (req: NextApiRequest) => {
  console.log('getting auth headers')
  const authToken = req ? await getAuthToken(req) : ''

  return {
    cookie: req ? req.headers.cookie : '',
    Authorization: authToken ? `Bearer ${authToken}` : '',
  }
}
