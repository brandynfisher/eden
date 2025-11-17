import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return new NextResponse('ELEVENLABS_API_KEY is not set', { status: 500 })
  }

  try {
    const client = new ElevenLabsClient({ apiKey })
    const voices = await client.voices.search({
      includeTotalCount: true,
      pageSize: 200,
    })

    return NextResponse.json(voices)
  } catch (error) {
    console.error(error)
    return new NextResponse('Error fetching voices', { status: 500 })
  }
}
