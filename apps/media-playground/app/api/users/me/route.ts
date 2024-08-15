import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const res = await eden.creators.meV2()

    if (!res) {
      return new NextResponse(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      })
    }

    // if (res.creator?.featureFlags && res.creator?.featureFlags.includes(FeatureFlag.Eden2EarlyAccess)) {
    return NextResponse.json(res)
    // }

    // return new NextResponse(JSON.stringify({ message: 'User not whitelisted for early access' }), { status: 403 })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
