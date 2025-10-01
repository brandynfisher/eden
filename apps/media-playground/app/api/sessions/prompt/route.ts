import { getAuthToken } from '@/lib/auth'
import { env, sessionConfig } from '@/lib/config'
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

  // If no session_id, we need agent_ids for creation
  if (!requestJson.session_id && !requestJson.agent_ids) {
    return new Response(
      JSON.stringify({
        message: 'agent_ids required when creating new session',
      }),
      {
        status: 400,
      },
    )
  }

  try {
    const payload = {
      session_id: requestJson.session_id,
      content: requestJson.content || '',
      attachments: requestJson.attachments || [],
      stream: sessionConfig.useStreaming,
      thinking: requestJson.thinking || false,
      agent_ids: requestJson.agent_ids,
      // For new sessions, include creation parameters
      ...(requestJson.session_id
        ? {}
        : {
            scenario: requestJson.scenario,
            budget: requestJson.budget,
            title: requestJson.title,
            autonomy_settings: requestJson.autonomy_settings,
          }),
    }

    const response = await fetch(
      `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
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
