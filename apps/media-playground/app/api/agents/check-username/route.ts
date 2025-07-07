import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
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

  // Check if username matches the required pattern
  const isValidPattern = /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/.test(username)
  if (!isValidPattern) {
    return new NextResponse(
      JSON.stringify({
        message:
          'Username must contain only lowercase letters, numbers, underscores and dashes',
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

    // Try to get an agent with this username
    // If it exists, username is taken. If it doesn't exist (404), it's available
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
    const errorMessage = handleAxiosServerError(error)
    console.error('***debug*** Username check error:', errorMessage)
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
