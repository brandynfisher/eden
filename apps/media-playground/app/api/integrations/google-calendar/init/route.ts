import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// Google Calendar OAuth goes through Fastify API (same as Twitter/TikTok integrations)
const EDEN_API_URL = process.env.EDEN_API_URL || 'http://localhost:5050'

export async function GET(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
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
    // Call Fastify API to get Google OAuth URL
    const response = await axios.get(
      `${EDEN_API_URL}/v2/auth/google-calendar/init`,
      {
        params: {
          agentId,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
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
