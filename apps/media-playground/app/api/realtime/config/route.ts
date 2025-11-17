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
    const agentId = process.env.ELEVENLABS_AGENT_ID

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: 'ElevenLabs configuration not complete' },
        { status: 500 },
      )
    }

    return NextResponse.json({ apiKey, agentId })
  } catch (error) {
    console.error('Error fetching ElevenLabs config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 },
    )
  }
}
