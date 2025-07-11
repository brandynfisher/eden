import { auth } from '@clerk/nextjs'
import { NextRequest, NextResponse } from 'next/server'

const EDEN_API_BASE_URL =
  process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

export async function PATCH(request: NextRequest) {
  try {
    const { getToken } = auth()
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.text()
    const url = new URL('/v2/notifications/archive', EDEN_API_BASE_URL)

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Archive notifications API error:', error)
    return NextResponse.json(
      { error: 'Failed to archive notifications' },
      { status: 500 },
    )
  }
}
