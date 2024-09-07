import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export const getAuthToken = async (req: NextRequest) => {
  const { getToken } = getAuth(req)
  const authToken = await getToken()
  return authToken || undefined
}
