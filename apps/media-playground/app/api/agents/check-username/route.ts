import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
    // Call the new Fastify endpoint directly
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_EDEN_API_URL
      }/v2/creators/check-username?username=${encodeURIComponent(username)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        {
          available: false,
          message: errorData.message || 'Error checking username',
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({
      available: data.available,
      username: data.username,
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
