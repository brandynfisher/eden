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
    const { sessionId, role, content } = body

    if (!sessionId || !role || !content) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing required fields' }),
        {
          status: 400,
        },
      )
    }

    // Get user ID
    const eden = new EdenClient({
      edenApiUrl: env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const userResponse = await eden.creators.meV2()
    if (!userResponse?.creator) {
      return new NextResponse(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      })
    }

    const userId = userResponse.creator._id

    const requestPayload = {
      session_id: sessionId,
      user_id: userId,
      role,
      content,
    }

    // Use the new Fastify endpoint that saves directly to MongoDB
    // without going through Eve API or triggering agent responses
    const apiResponse = await fetch(
      `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions/add-message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestPayload),
      },
    )

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      throw new Error(`Failed to add message: ${errorText}`)
    }

    const data = await apiResponse.json()
    return NextResponse.json({ success: true, message_id: data.message_id })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
