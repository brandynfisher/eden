import { auth } from '@clerk/nextjs'
import { NextRequest, NextResponse } from 'next/server'

const EDEN_API_BASE_URL =
  process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

export async function GET(request: NextRequest) {
  try {
    const { getToken } = auth()
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL('/v2/notifications/count', EDEN_API_BASE_URL)

    // Copy query parameters
    const searchParams = request.nextUrl.searchParams
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Get notification count API error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification count' },
      { status: 500 },
    )
  }
}
