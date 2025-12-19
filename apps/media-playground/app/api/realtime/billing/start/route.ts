import { getAuthToken } from '@/lib/auth'
import { env } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const body = await request.json()
    const { agentId, sessionId } = body

    if (!agentId) {
      return new NextResponse(JSON.stringify({ message: 'Missing agentId' }), {
        status: 400,
      })
    }

    // Initialize Eden client with user's auth token
    const eden = new EdenClient({
      edenApiUrl: env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    // Call billing start using SDK
    const res = await eden.realtimeSessions.start({
      agentId,
      ...(sessionId && { sessionId }),
    })

    return NextResponse.json(res)
  } catch (error) {
    console.error('Error starting billing session:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
