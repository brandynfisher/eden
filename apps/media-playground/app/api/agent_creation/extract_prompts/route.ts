import { env } from '@/lib/config'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    })
  }

  try {
    const body = await request.json()
    console.log('[Extract Agent Prompts] Request body:', body)

    const targetUrl = `${env.NEXT_PUBLIC_EDEN_API_URL}/agent_creation/extract_prompts`
    console.log('[Extract Agent Prompts] Target URL:', targetUrl)
    console.log(
      '[Extract Agent Prompts] EDEN_API_URL:',
      env.NEXT_PUBLIC_EDEN_API_URL,
    )

    if (!env.NEXT_PUBLIC_EDEN_API_URL) {
      throw new Error('NEXT_PUBLIC_EDEN_API_URL is not configured')
    }

    // Backend expects session_id and agent_name in body, user_id comes from auth token
    // Use keepalive and extended timeout for large LLM responses
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        Connection: 'keep-alive',
      },
      body: JSON.stringify({
        session_id: body.session_id,
        agent_name: body.agent_name,
      }),
      // Increase timeout to 3 minutes for LLM processing
      signal: AbortSignal.timeout(180000),
      keepalive: true,
    } as RequestInit)

    console.log('[Extract Agent Prompts] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        '[Extract Agent Prompts] Backend error response:',
        response.status,
        errorText,
      )
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
    console.log('[Extract Agent Prompts] Success response:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Extract Agent Prompts] Exception caught:', error)
    console.error(
      '[Extract Agent Prompts] Error type:',
      error?.constructor?.name,
    )
    console.error(
      '[Extract Agent Prompts] Error message:',
      error instanceof Error ? error.message : String(error),
    )

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
