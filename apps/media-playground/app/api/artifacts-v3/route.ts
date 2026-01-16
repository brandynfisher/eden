import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { ArtifactsV3ListResponse, EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const ownerId = searchParams.get('ownerId') || undefined
  const type = searchParams.get('type') || undefined
  const sessionId = searchParams.get('sessionId') || undefined
  const orderBy = searchParams.get('orderBy') || undefined
  const directionParam = searchParams.get('direction')
  const direction = directionParam ? Number(directionParam) : undefined

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken || undefined,
    })

    const res = await eden.artifactsV3.list({
      page,
      limit,
      ownerId,
      type,
      sessionId,
      orderBy,
      direction,
    })

    return NextResponse.json<ArtifactsV3ListResponse>(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
