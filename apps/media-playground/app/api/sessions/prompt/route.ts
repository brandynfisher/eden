import { getAuthToken } from '@/lib/auth'
import { env } from '@/lib/config'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new Response(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  const requestJson = await request.json()

  if (!requestJson) {
    return new Response(JSON.stringify({ message: 'No data passed' }), {
      status: 400,
    })
  }

  if (
    !requestJson.content &&
    !(requestJson.attachments && requestJson.attachments.length)
  ) {
    return new Response(
      JSON.stringify({ message: 'Neither content nor attachments passed' }),
      {
        status: 400,
      },
    )
  }

  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          session_id: requestJson.session_id,
          content: requestJson.content,
          attachments: requestJson.attachments,
          stream: true,
        }),
      },
    )

    if (!response.ok) {
      return new Response(
        JSON.stringify({ message: 'Failed to start stream' }),
        { status: response.status },
      )
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Streaming error:', error)
    return new Response(JSON.stringify({ message: 'Stream failed' }), {
      status: 500,
    })
  }
}
