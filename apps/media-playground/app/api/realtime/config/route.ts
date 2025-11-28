import { ELEVENLABS_AGENT_ID } from '@/lib/voice/realtime-defaults'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { getToken } = getAuth(request)
    const authToken = await getToken()

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY_REALTIME

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 },
      )
    }

    return NextResponse.json({ apiKey, agentId: ELEVENLABS_AGENT_ID })
  } catch (error) {
    console.error('Error fetching ElevenLabs config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 },
    )
  }
}
