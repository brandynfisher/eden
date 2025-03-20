import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy media requests to avoid CORS issues
 *
 * @param request The incoming request
 * @returns The proxied response
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = request.nextUrl.searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL parameter' },
        { status: 400 },
      )
    }

    console.log(`Proxying request to: ${url}`)

    // Fetch the resource
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
    })

    // Check if the fetch was successful
    if (!response.ok) {
      console.error(
        `Failed to fetch: ${response.status} ${response.statusText}`,
      )
      return NextResponse.json(
        { error: `Failed to fetch: ${response.statusText}` },
        { status: response.status },
      )
    }

    // Get the data as an array buffer
    const data = await response.arrayBuffer()

    // Get content type
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream'

    // Log successful response
    console.log(`Successfully proxied ${url} with content type ${contentType}`)

    // Create a response with the data and appropriate headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow from any origin
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      {
        error: 'Failed to proxy request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
