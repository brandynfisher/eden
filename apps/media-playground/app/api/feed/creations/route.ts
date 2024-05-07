import { type NextRequest } from 'next/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { extractFeedParams, handleAxiosServerError } from '@/lib/fetcher'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const feedQueryParams = extractFeedParams(searchParams)

    const eden = new EdenClient({
      edenApiUrl: process.env.EDEN_API_URL,
    })
    const res = await eden.feed_cursor.creations(feedQueryParams)
    return Response.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500 },
    )
  }
}
