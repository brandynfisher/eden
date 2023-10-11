import { getAuth } from '@clerk/nextjs/server'
import { message } from 'antd'
import { NextApiRequest } from 'next'

export const requireAuth = async (authenticate: () => void) => {
  try {
    message.destroy()
    message.error(
      'You must be logged in to do that. Sign the login message to continue.',
    )
    await authenticate()
  } catch (error) {
    return
  }
}

export const getAuthToken = async (req: NextApiRequest) => {
  if (process.env.NEXT_PUBLIC_FLAG_CLERK_ENABLED === 'yes') {
    const { getToken } = getAuth(req)
    const authToken = await getToken()
    return authToken || undefined
  }
  return req.session.token
}
