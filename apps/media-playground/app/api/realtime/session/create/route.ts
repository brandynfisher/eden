import { getAuthToken } from '@/lib/auth'
import { env } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient, SessionType } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    // Parse request body
    const body = await request.json()
    const { agentId } = body

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

    // Create session using Eden SDK (same as chat route)
    const res = await eden.sessions.v2.create({
      agent_ids: [agentId],
      title: 'Realtime Conversation',
      session_type: SessionType.CHAT,
      status: 'active',
    })

    if (!res.success) {
      return new NextResponse(
        JSON.stringify({
          message: res.message || 'Session creation failed',
        }),
        {
          status: 500,
        },
      )
    }

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
