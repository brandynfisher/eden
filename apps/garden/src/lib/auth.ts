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

export const getAuthToken = (req: NextApiRequest) => {
  return req.session.token
}
