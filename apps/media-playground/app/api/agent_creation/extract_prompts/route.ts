import { env } from '@/lib/config'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { getToken, userId } = getAuth(request)
  const authToken = await getToken()

  if (!authToken || !userId) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    })
  }

  try {
    const body = await request.json()

    const targetUrl = `${env.NEXT_PUBLIC_EDEN_API_URL}/agent_creation/extract_prompts`

    if (!env.NEXT_PUBLIC_EDEN_API_URL) {
      throw new Error('NEXT_PUBLIC_EDEN_API_URL is not configured')
    }

    // Backend expects user_id, session_id, and agent_name in body
    // Use keepalive and extended timeout for large LLM responses
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        Connection: 'keep-alive',
      },
      body: JSON.stringify({
        user_id: userId,
        session_id: body.session_id,
        agent_name: body.agent_name,
      }),
      // Increase timeout to 3 minutes for LLM processing
      signal: AbortSignal.timeout(180000),
      keepalive: true,
    } as RequestInit)

    if (!response.ok) {
      const errorText = await response.text()
      return new NextResponse(
        JSON.stringify({
          message: `Agent prompts extraction failed: ${response.statusText}`,
          details: errorText,
        }),
        {
          status: response.status,
        },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
