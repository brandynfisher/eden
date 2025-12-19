import { getAuthToken } from '@/lib/auth'
import { env } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

interface Params {
  params: { realtimeSessionId: string }
}

export async function POST(request: NextRequest, { params }: Params) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const { realtimeSessionId } = params

    // Initialize Eden client with user's auth token
    const eden = new EdenClient({
      edenApiUrl: env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    // Call heartbeat using SDK
    const res = await eden.realtimeSessions.heartbeat({
      realtimeSessionId,
    })

    return NextResponse.json(res)
  } catch (error) {
    console.error('Error sending heartbeat:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
