import { getAuthToken } from '@/lib/auth'
import { EdenClient } from '@edenlabs/eden-sdk'
import { AxiosError } from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authToken = await getAuthToken(request)

  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get('username')

  if (!username) {
    return new NextResponse(
      JSON.stringify({ message: 'Username parameter is required' }),
      {
        status: 400,
      },
    )
  }

  if (username.length < 2 || username.length > 42) {
    return new NextResponse(
      JSON.stringify({
        message: 'Username must be between 2 and 42 characters',
        available: false,
      }),
      {
        status: 400,
      },
    )
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken || undefined,
    })

    // Check if username exists by trying to get an agent with that username
    // This uses the same query as the working /v2/agents/:agentId endpoint
    try {
      const res = await eden.agents.get({
        agentId: username,
      })

      // If we get a response, the username is taken
      if (res?.agent) {
        return NextResponse.json({
          available: false,
          message: 'Username is already taken',
        })
      }
    } catch (error) {
      // If we get a 404 error, that means the username is available
      const axiosError = error as AxiosError
      if (axiosError?.response?.status === 404) {
        return NextResponse.json({
          available: true,
          message: 'Username is available',
        })
      }

      // If it's any other error, we should handle it
      throw error
    }

    // This shouldn't happen but just in case
    return NextResponse.json({
      available: false,
      message: 'Unable to determine availability',
    })
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        message: 'Internal server error while checking username',
        available: false,
      }),
      {
        status: 500,
      },
    )
  }
}
