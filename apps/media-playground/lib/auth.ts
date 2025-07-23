import { auth, getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { FeatureFlag } from '@edenlabs/eden-sdk'
import { redirect } from 'next/navigation'
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

export const requireFeatureFlag = async (
  requiredFlag: FeatureFlag,
  redirectTo: string = '/',
) => {
  try {
    const { getToken, userId } = await auth()
    const authToken = await getToken()

    if (!authToken || !userId) {
      redirect(redirectTo)
      return
    }

    // Fetch user data to check feature flags
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const userData = await eden.creators.meV2()
    const hasRequiredFlag =
      userData?.creator?.featureFlags?.includes(requiredFlag)

    if (!hasRequiredFlag) {
      redirect(redirectTo)
      return
    }

    return {
      user: userData?.creator,
      authToken,
      userId,
    }
  } catch (error) {
    redirect(redirectTo)
    return
  }
}
