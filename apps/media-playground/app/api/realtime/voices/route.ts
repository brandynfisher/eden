import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

interface VerifiedLanguage {
  language: string
  model_id: string
  accent?: string | null
  locale?: string | null
}

interface ElevenLabsVoice {
  voice_id: string
  name: string
  category?: string
  description?: string | null
  labels?: Record<string, string>
  preview_url?: string | null
  verified_languages?: VerifiedLanguage[] | null
  is_owner?: boolean | null
}

interface ElevenLabsV2VoicesResponse {
  voices: ElevenLabsVoice[]
  has_more: boolean
  total_count?: number
  next_page_token?: string | null
}

export interface VoiceOption {
  value: string
  label: string
  description?: string
  previewUrl?: string
  gender?: string
  languages: string[] // All supported languages (from verified_languages)
}

function extractGender(voice: ElevenLabsVoice): string | undefined {
  return voice.labels?.gender
}

function extractLanguages(voice: ElevenLabsVoice): string[] {
  const languages: string[] = []

  // Extract all languages from verified_languages
  if (voice.verified_languages && voice.verified_languages.length > 0) {
    for (const vl of voice.verified_languages) {
      if (vl.language && !languages.includes(vl.language)) {
        languages.push(vl.language)
      }
    }
  }

  // Also include language from labels if not already present
  if (voice.labels?.language && !languages.includes(voice.labels.language)) {
    languages.push(voice.labels.language)
  }

  return languages
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { getToken } = getAuth(request)
    const authToken = await getToken()

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 },
      )
    }

    // Parse query parameters for client-side filtering
    const { searchParams } = new URL(request.url)
    const gender = searchParams.get('gender') // 'male' or 'female'
    const language = searchParams.get('language') // language code like 'en', 'nl', etc.

    // Fetch ALL voices by paginating through all pages using REST API
    // (SDK has React dependencies that don't work in API routes)
    const apiUrl = `https://api.elevenlabs.io/v2/voices?page_size=100&include_total_count=true`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'Failed to fetch voices from ElevenLabs', details: errorText },
        { status: response.status },
      )
    }

    const responseText = await response.text()

    let data: ElevenLabsV2VoicesResponse
    try {
      data = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse ElevenLabs response' },
        { status: 500 },
      )
    }

    const allVoices = data.voices || []

    // Transform and filter voices
    let voices: VoiceOption[] = allVoices
      .filter(voice => voice.name) // Filter out voices without names
      .map(voice => ({
        value: voice.voice_id,
        label: voice.name,
        description: voice.description || undefined,
        previewUrl: voice.preview_url || undefined,
        gender: extractGender(voice),
        languages: extractLanguages(voice),
      }))

    const totalCount = voices.length

    // Apply client-side filters
    if (gender) {
      voices = voices.filter(v => v.gender === gender)
    }

    if (language) {
      // Filter voices that support the requested language (check all languages, not just primary)
      voices = voices.filter(v => v.languages.includes(language))
    }

    // Sort alphabetically by name
    voices.sort((a, b) => a.label.localeCompare(b.label))

    return NextResponse.json({
      voices,
      hasMore: false,
      totalCount,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 },
    )
  }
}
