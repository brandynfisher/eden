import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  console.log(`[Dashboard API] Starting request for agent: ${id}`)

  if (!id) {
    console.log('[Dashboard API] Error: Missing agent id')
    return new NextResponse(JSON.stringify({ message: 'Missing agent id' }), {
      status: 400,
    })
  }

  const { getToken } = getAuth(request)
  const authToken = await getToken()

  console.log(`[Dashboard API] Auth token exists: ${!!authToken}`)

  if (!authToken) {
    console.log('[Dashboard API] Error: Not authenticated')
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log(
      `[Dashboard API] Query params - startDate: ${startDate}, endDate: ${endDate}`,
    )
    console.log(
      `[Dashboard API] Eden API URL: ${process.env.NEXT_PUBLIC_EDEN_API_URL}`,
    )

    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    console.log(
      `[Dashboard API] Making request to Eden API: /v2/agents/${id}/dashboard`,
    )

    const response = await eden.apiCall(() => ({
      url: `/v2/agents/${id}/dashboard`,
      method: 'GET',
      params: {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      },
    }))

    console.log(
      `[Dashboard API] Successfully got response from Eden API`,
      response,
    )
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Dashboard API] Error fetching dashboard data:', error)

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
    console.error(`[Dashboard API] Processed error message: ${errorMessage}`)

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
