import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  if (!id) {
    return new NextResponse(JSON.stringify({ message: 'Missing agent id' }), {
      status: 400,
    })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const response = await eden.apiCall(() => ({
      url: `/v2/agents/${id}/dashboard`,
      method: 'GET',
      params: {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      },
    }))

    return NextResponse.json(response)
  } catch (error) {
    // Log more details about the error
    if (error && typeof error === 'object') {
      const errorObj = error as Error & {
        status?: number
        response?: { data?: unknown }
      }
      console.error('[Dashboard API] Error details:', {
        message: errorObj.message,
        status: errorObj.status,
        response: errorObj.response?.data,
        stack: errorObj.stack,
      })
    }

    const errorMessage = handleAxiosServerError(error)

    return new NextResponse(
      JSON.stringify({
        message: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
      },
    )
  }
}
