import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient, VerdelisSeedsV2ListResponse } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')
  const agentId = searchParams.get('agentId')

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken || undefined,
    })

    const res = await eden.verdelisSeeds.list({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      agentId: agentId || undefined,
    })

    return NextResponse.json<VerdelisSeedsV2ListResponse>(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
