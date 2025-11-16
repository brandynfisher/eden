import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authToken = await getAuthToken(request)

    if (!authToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 },
      )
    }

    const client = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      token: authToken,
    })

    const response = await client.userPreferences.get({})

    if (response.error) {
      return NextResponse.json({ message: response.error }, { status: 400 })
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
