import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  const { getToken, userId } = await getAuth(request)

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }

  const authToken = await getToken()
  const searchParams = request.nextUrl.searchParams
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing agentId parameter' }),
      { status: 400 },
    )
  }

  try {
    // Delete the Google Calendar deployment via the deployments API
    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/agents/${agentId}/deployments/google_calendar`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Google Calendar disconnect error:', error)
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(
      JSON.stringify({
        error: errorMessage || 'Failed to disconnect Google Calendar',
      }),
      { status: 500 },
    )
  }
}
