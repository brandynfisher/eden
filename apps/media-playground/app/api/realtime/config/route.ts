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

    // NOTE: never return ELEVENLABS_API_KEY from here. This route previously
    // did, which handed Eden's raw provider credential to any logged-in user —
    // unmetered use of Eden's ElevenLabs account, surviving a ban. The browser
    // never needed it: the agent is public and startSession() is called with
    // only agentId + overrides (see lib/voice/use-voice-conversation.tsx).
    // If a private agent is ever required, mint a short-lived conversation
    // token server-side (ElevenLabs get_signed_url) and return that instead.
    return NextResponse.json({ agentId: ELEVENLABS_AGENT_ID })
  } catch (error) {
    console.error('Error fetching ElevenLabs config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 },
    )
  }
}
