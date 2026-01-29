import { getAuthToken } from '@/lib/auth'
import { extractPaginationParams, handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient, SessionPlatformFilter } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authToken = await getAuthToken(request)

  if (!authToken) {
    return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
      status: 401,
    })
  }

  const paginationParams = extractPaginationParams(request.nextUrl.searchParams)
  const rawPlatforms = request.nextUrl.searchParams.getAll('platforms')
  const platforms = rawPlatforms
    .flatMap(platform => platform.split(','))
    .map(platform => platform.trim())
    .filter(Boolean)
  const validPlatforms: SessionPlatformFilter[] = [
    'web',
    'discord',
    'telegram',
    'twitter',
    'farcaster',
  ]
  const allowedPlatforms = platforms.filter(platform =>
    validPlatforms.includes(platform as SessionPlatformFilter),
  ) as SessionPlatformFilter[]

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })
    const res = await eden.sessions.v2.list({
      ...paginationParams,
      agent_id: request.nextUrl.searchParams.get('agent_id') || undefined,
      ...(allowedPlatforms.length > 0 ? { platforms: allowedPlatforms } : {}),
    })

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
