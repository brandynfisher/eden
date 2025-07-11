import { auth } from '@clerk/nextjs'
import { NextRequest, NextResponse } from 'next/server'

const EDEN_API_BASE_URL =
  process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

async function proxyRequest(
  request: NextRequest,
  endpoint: string,
  method: string = 'GET',
) {
  try {
    const { getToken } = auth()
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(endpoint, EDEN_API_BASE_URL)

    // Copy query parameters for GET requests
    if (method === 'GET') {
      const searchParams = request.nextUrl.searchParams
      searchParams.forEach((value, key) => {
        url.searchParams.set(key, value)
      })
    }

    const body = method !== 'GET' ? await request.text() : undefined

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
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
    console.error('Notification API proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy notification request' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/v2/notifications')
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, '/v2/notifications', 'POST')
}


