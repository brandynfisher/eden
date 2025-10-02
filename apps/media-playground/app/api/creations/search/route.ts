import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const { searchParams } = new URL(request.url)
  // The frontend sends 'search' but backend expects 'query'
  const query = searchParams.get('search') || searchParams.get('query')
  const agentId = searchParams.get('agentId')
  const userId = searchParams.get('userId')
  const tool = searchParams.get('tool')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  if (!query) {
    return new NextResponse(
      JSON.stringify({ message: 'Search query parameter is required' }),
      {
        status: 400,
      },
    )
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken !== null ? authToken : undefined,
    })

    const res = await eden.creations.searchV2({
      query,
      agentId: agentId || undefined,
      userId: userId || undefined,
      tool: tool || undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })

    if (!res) {
      return new NextResponse(JSON.stringify({ message: 'Search failed' }), {
        status: 404,
      })
    }

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
