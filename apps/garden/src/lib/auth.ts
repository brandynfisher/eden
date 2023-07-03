import { message } from 'antd'

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
