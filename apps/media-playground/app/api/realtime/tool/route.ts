import { getAuthToken } from '@/lib/auth'
import { env } from '@/lib/config'
import { NextRequest, NextResponse } from 'next/server'

interface RealtimeToolRequest {
  tool_name: string
  args: Record<string, unknown>
  session_id: string
}

export async function POST(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body: RealtimeToolRequest = await request.json()
    const { tool_name, args, session_id } = body

    if (!tool_name) {
      return NextResponse.json(
        { message: 'Missing tool_name' },
        { status: 400 },
      )
    }

    if (!session_id) {
      return NextResponse.json(
        { message: 'Missing session_id' },
        { status: 400 },
      )
    }

    // Call Fastify API which handles Eve communication
    const response = await fetch(
      `${env.NEXT_PUBLIC_EDEN_API_URL}/v2/realtime/tool`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tool_name,
          args,
          session_id,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Realtime Tool] API error:', errorText)
      return NextResponse.json(
        { message: `API error: ${errorText}` },
        { status: response.status },
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Realtime Tool] Error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
