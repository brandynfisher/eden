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
    // Parse request body
    const body = await request.json()
    const { agentId, userInfo } = body

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

    // Create session using Eden SDK
    // Note: session_type defaults to 'chat' if not provided, so we omit it
    // status defaults to 'active' if not provided, so we omit it
    const res = await eden.sessions.v2.create({
      agent_ids: [agentId],
      title: 'Realtime Conversation',
    })

    if (!res.success) {
      console.error('Session creation failed:', res.message, res)
      return new NextResponse(
        JSON.stringify({
          message: res.message || 'Session creation failed',
        }),
        {
          status: 500,
        },
      )
    }

    // If user info provided, dump it as the first message in the session
    const sessionId = (res.session as { _id?: string } | undefined)?._id
    if (userInfo && Object.keys(userInfo).length > 0 && sessionId) {
      try {
        // Get user ID for the passive message endpoint
        const userResponse = await eden.creators.meV2()
        const userId = userResponse?.creator?._id

        if (userId) {
          // Format user info as a clear key:value JSON dict with context message
          const userInfoEntries = Object.entries(userInfo)
            .map(([key, value]) => `"${key}": "${value}"`)
            .join(', ')
          const formattedMessage = `[User Info Collected at Start of Conversation]\n{${userInfoEntries}}`

          // Add passive message using the Fastify endpoint
          const messageResponse = await fetch(
            `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions/add-message`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                session_id: sessionId,
                user_id: userId,
                role: 'user',
                content: formattedMessage,
              }),
            },
          )

          if (!messageResponse.ok) {
            console.error(
              'Failed to add user info message:',
              await messageResponse.text(),
            )
          }
        }
      } catch (error) {
        // Log but don't fail session creation if user info message fails
        console.error('Failed to add user info message:', error)
      }
    }

    return NextResponse.json(res)
  } catch (error) {
    console.error('Error in session create endpoint:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
