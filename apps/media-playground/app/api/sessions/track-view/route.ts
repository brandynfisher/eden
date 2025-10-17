import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  let body
  try {
    body = await request.json()
  } catch (error) {
    console.error('[TRACK VIEW] Failed to parse request body:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Invalid request body' }),
      {
        status: 400,
      },
    )
  }

  const { session_id } = body

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions/track-view`,
      { session_id },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error('[TRACK VIEW] Error:', errorMessage)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
