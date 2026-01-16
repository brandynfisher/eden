import { handleAxiosServerError } from '@/lib/fetcher'
import { getAuth } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  try {
    const edenApiUrl =
      process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

    const response = await axios.get(`${edenApiUrl}/v2/triggers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    })
  }
}

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request)
  const authToken = await getToken()

  if (!authToken) {
    return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    })
  }

  const requestJson = await request.json()

  const { name, prompt, session, agent, schedule, session_target } = requestJson

  // Either session or agent must be provided
  if (!session && !agent) {
    return new NextResponse(
      JSON.stringify({ error: 'Session or agent is required' }),
      {
        status: 400,
      },
    )
  }

  try {
    const edenApiUrl =
      process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

    const payloadToApi = {
      name,
      prompt,
      ...(session && { session }),
      ...(agent && { agent }),
      ...(session_target && { session_target }),
      ...(schedule && { schedule }),
    }

    const response = await axios.post(
      `${edenApiUrl}/v2/triggers`,
      payloadToApi,
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
