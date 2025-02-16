import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export const getAuthToken = async (req: NextRequest) => {
  try {
    const { getToken } = getAuth(req)
    const authToken = await getToken()
    return authToken || undefined
  } catch (error) {
    console.error('Error getting auth token', error)
    return undefined
  }
}
