import { getAuthToken } from '@/lib/auth'
import { env } from '@/lib/config'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new Response(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  const sessionId = params.id

  if (!sessionId) {
    return new Response(JSON.stringify({ message: 'Session ID required' }), {
      status: 400,
    })
  }

  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions/${sessionId}/stream`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({
          message: errorText || 'Failed to connect to session stream',
        }),
        { status: response.status },
      )
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Session stream error:', error)
    return new Response(
      JSON.stringify({ message: 'Failed to establish stream connection' }),
      {
        status: 500,
      },
    )
  }
}
