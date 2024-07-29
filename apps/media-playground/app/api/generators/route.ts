import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
    })

    const query =
      searchParams.get('hideParams') === 'true'
        ? { hideParams: true }
        : undefined

    const res = await eden.generators.listV2(query)
    return Response.json({ generators: res.generators })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
