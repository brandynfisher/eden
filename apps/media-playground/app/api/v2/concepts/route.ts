import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const EDEN_API_BASE_URL =
  process.env.NEXT_PUBLIC_EDEN_API_URL || 'https://api.eden.art'

async function proxyRequest(
  request: NextRequest,
  endpoint: string,
  method: string = 'GET',
) {
  try {
    const { getToken } = getAuth(request)
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

    // Build headers without duplicating content-type
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    // Only set content-type for non-GET requests with body
    if (method !== 'GET' && body) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
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
    console.error('Concepts API proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy concepts request' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/v2/concepts')
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, '/v2/concepts', 'POST')
}
