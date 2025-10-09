import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const queryParams: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    queryParams[key] = value
  })

  console.log('[NOTIFICATIONS API] GET request with params:', queryParams)

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })

    const res = await eden.notifications.list(queryParams)

    console.log('[NOTIFICATIONS API] Response:', {
      total_count: res.total_count,
      unread_count: res.unread_count,
      notifications_count: res.notifications.length,
    })

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error('[NOTIFICATIONS API] Error:', errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
