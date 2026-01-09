import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  let requestJson
  try {
    requestJson = await request.json()
  } catch (e) {
    return new NextResponse(JSON.stringify({ message: 'Invalid JSON' }), {
      status: 400,
    })
  }

  const { session_id } = requestJson

  // Validation
  if (!session_id) {
    return new NextResponse(
      JSON.stringify({ message: 'session_id is required' }),
      {
        status: 400,
      },
    )
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/sessions/next-turn`

    const response = await axios.post(
      apiUrl,
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
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}
