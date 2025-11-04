import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authToken = await getAuthToken(request)

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') || undefined
  const limitStr = searchParams.get('limit')
  const limit = limitStr ? parseInt(limitStr, 10) : undefined

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken || undefined,
    })

    const res = await eden.sessions.v2.getMessages({
      session_id: params.id,
      cursor,
      limit,
    })

    return NextResponse.json(res)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error('Failed to fetch session messages:', errorMessage)

    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500
      return new NextResponse(JSON.stringify({ message: errorMessage }), {
        status,
      })
    }

    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
