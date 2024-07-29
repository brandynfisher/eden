import { extractFeedParams, handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const feedQueryParams = extractFeedParams(searchParams)

    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
    })
    const res = await eden.feed_cursor.creations(feedQueryParams)
    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
