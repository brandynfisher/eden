import { toast } from 'react-toastify'

export const requireAuth = async (authenticate: () => void) => {
  try {
    toast.error(
      'You must be logged in to do that. Sign the login message to continue.',
    )
    await authenticate()
  } catch (error) {
    return
  }
}
