import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// Google Calendar OAuth endpoints are on the Eve (Python) backend, not Fastify.
// Local: http://localhost:8000
// Production: https://edenartlab--api-prod-fastapi-app.modal.run
// Staging: https://edenartlab--api-stage-fastapi-app.modal.run
const EVE_API_URL = process.env.EVE_API_URL || 'http://localhost:8000'

// Eve backend requires admin key for this endpoint
const EDEN_ADMIN_KEY = process.env.EDEN_ADMIN_KEY

export async function GET(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }

  if (!EDEN_ADMIN_KEY) {
    console.error('EDEN_ADMIN_KEY is not configured')
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500 },
    )
  }

  const searchParams = request.nextUrl.searchParams
  const agentId = searchParams.get('agent_id')

  if (!agentId) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing agent_id parameter' }),
      { status: 400 },
    )
  }

  try {
    // Get the Eden user ID using the same pattern as /api/users/me
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const userResponse = await eden.creators.meV2()
    const edenUserId = userResponse.creator?._id

    if (!edenUserId) {
      console.error('Could not get Eden user ID:', userResponse)
      return new NextResponse(
        JSON.stringify({ error: 'Could not determine user ID' }),
        { status: 400 },
      )
    }

    // Build the redirect URI for after OAuth completion
    // This should point to our Next.js callback route
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`

    // Call Eve backend to get Google OAuth URL
    // Eve requires EDEN_ADMIN_KEY for this endpoint
    const response = await axios.get(
      `${EVE_API_URL}/v2/auth/google-calendar/init`,
      {
        params: {
          agent_id: agentId,
          user_id: edenUserId,
          redirect_uri: redirectUri,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${EDEN_ADMIN_KEY}`,
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Google Calendar OAuth init error:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(
      JSON.stringify({ error: errorMessage || 'Failed to initialize OAuth' }),
      { status: 500 },
    )
  }
}
